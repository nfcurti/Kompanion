import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
} from "playwright";

import {
  allowedHostsForSkill,
  assertPublicHttps,
  hostAllowed,
  reachedRequestedUrl,
} from "@/lib/skill-http";
import { skillHasLogin, type Skill } from "@/lib/skills";

const IDLE_MS = 5 * 60_000;
const SNAPSHOT_CHARS = 8_000;
const NAV_TIMEOUT_MS = 30_000;

type SkillSession = {
  context: BrowserContext;
  page: Page;
  idle: ReturnType<typeof setTimeout>;
};

let sharedBrowser: Browser | null = null;
const sessions = new Map<string, SkillSession>();

function clip(text: string, max = SNAPSHOT_CHARS): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}\n…truncated`;
}

function launchErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/executable does not exist|browserType\.launch/i.test(message)) {
    return "Chromium is not installed. Run `npx playwright install chromium` and retry.";
  }
  return message;
}

async function getBrowser(): Promise<Browser> {
  if (sharedBrowser?.isConnected()) return sharedBrowser;
  try {
    sharedBrowser = await chromium.launch({
      headless: true,
      args: ["--disable-dev-shm-usage"],
    });
    return sharedBrowser;
  } catch (error) {
    throw new Error(launchErrorMessage(error));
  }
}

function touchIdle(skillId: string) {
  const session = sessions.get(skillId);
  if (!session) return;
  clearTimeout(session.idle);
  session.idle = setTimeout(() => {
    void closeSkillBrowser(skillId);
  }, IDLE_MS);
}

async function assertAllowedUrl(skill: Skill, rawUrl: string): Promise<URL> {
  const url = new URL(rawUrl);
  const allowed = allowedHostsForSkill(skill);
  await assertPublicHttps(url);
  if (!hostAllowed(url.hostname, allowed)) {
    throw new Error(`Host ${url.hostname} is not allowed for this skill.`);
  }
  return url;
}

async function snapshot(page: Page) {
  const [aria, text] = await Promise.all([
    page.locator("html").ariaSnapshot({ timeout: 5_000 }).catch(() => ""),
    page.locator("body").innerText().catch(() => ""),
  ]);
  const loginFormVisible = (await page.locator('input[type="password"]').count()) > 0;
  return {
    ok: true as const,
    url: page.url(),
    title: await page.title().catch(() => ""),
    loginFormVisible,
    snapshot: clip(aria || text),
  };
}

async function getSession(skillId: string): Promise<SkillSession> {
  const session = sessions.get(skillId);
  if (!session) {
    throw new Error(
      `No browser session for ${skillId}. Call skillBrowserOpen first.`,
    );
  }
  touchIdle(skillId);
  return session;
}

async function fillStoredLogin(page: Page, skill: Skill) {
  if (!skillHasLogin(skill) || !skill.auth) {
    throw new Error(`Skill ${skill.id} has no login URL, username, and password saved.`);
  }
  const loginUrl = await assertAllowedUrl(skill, skill.auth.loginUrl);
  await page.goto(loginUrl.href, {
    waitUntil: "domcontentloaded",
    timeout: NAV_TIMEOUT_MS,
  });
  const password = page.locator('input[type="password"]').first();
  await password.waitFor({ state: "visible", timeout: 20_000 });
  const user = page
    .locator(
      'input[type="email"]:visible, input[name="email" i]:visible, input[name="username" i]:visible, input[autocomplete="username"]:visible, input[type="text"]:visible',
    )
    .first();
  await user.fill(skill.auth.username, { timeout: 10_000 });
  await password.fill(skill.auth.password);
  const submit = page
    .locator(
      'button[type="submit"], input[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login"), button:has-text("Accedi")',
    )
    .first();
  if ((await submit.count()) > 0) {
    await submit.click();
  } else {
    await password.press("Enter");
  }
  await page.waitForLoadState("domcontentloaded", { timeout: NAV_TIMEOUT_MS });
  await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => undefined);
}

export async function closeSkillBrowser(skillId: string) {
  const session = sessions.get(skillId);
  if (!session) return;
  clearTimeout(session.idle);
  sessions.delete(skillId);
  await session.context.close().catch(() => undefined);
}

export async function skillBrowserOpen(options: {
  skill: Skill;
  url?: string;
  login?: boolean;
}) {
  const { skill, login } = options;
  await closeSkillBrowser(skill.id);

  const startUrl = options.url
    ? await assertAllowedUrl(skill, options.url)
    : login && skill.auth?.loginUrl
      ? await assertAllowedUrl(skill, skill.auth.loginUrl)
      : null;

  if (!startUrl && !login) {
    return {
      ok: false as const,
      error: "Provide a url, or set login: true when the skill has stored credentials.",
    };
  }

  const browser = await getBrowser();
  const context = await browser.newContext({
    locale: "en-US",
    ignoreHTTPSErrors: false,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(20_000);
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

  const session: SkillSession = {
    context,
    page,
    idle: setTimeout(() => {
      void closeSkillBrowser(skill.id);
    }, IDLE_MS),
  };
  sessions.set(skill.id, session);

  try {
    if (login) {
      await fillStoredLogin(page, skill);
    }
    if (startUrl) {
      const alreadyThere = reachedRequestedUrl(startUrl.href, page.url());
      if (!login || !alreadyThere) {
        await page.goto(startUrl.href, {
          waitUntil: "domcontentloaded",
          timeout: NAV_TIMEOUT_MS,
        });
        await page
          .waitForLoadState("networkidle", { timeout: 12_000 })
          .catch(() => undefined);
      }
    }
    const shot = await snapshot(page);
    const requestedUrl = startUrl?.href ?? shot.url;
    const reached = reachedRequestedUrl(requestedUrl, shot.url);
    return {
      ...shot,
      requestedUrl,
      redirected: !reached,
      reachedRequestedUrl: reached,
      warning: reached
        ? undefined
        : `Browser is on ${shot.url}, not the requested path ${requestedUrl}. Use skillBrowserAct goto or in-page navigation. Do not treat this page as the task URL.`,
    };
  } catch (error) {
    await closeSkillBrowser(skill.id);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Browser open failed",
    };
  }
}

export async function skillBrowserAct(options: {
  skill: Skill;
  action: "click" | "fill" | "press" | "goto";
  selector?: string;
  value?: string;
}) {
  try {
    const { page } = await getSession(options.skill.id);

    if (options.action === "goto") {
      if (!options.value) {
        return { ok: false as const, error: "goto requires value (https URL)." };
      }
      const url = await assertAllowedUrl(options.skill, options.value);
      await page.goto(url.href, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      });
      return snapshot(page);
    }

    if (!options.selector) {
      return { ok: false as const, error: `${options.action} requires a CSS selector.` };
    }

    const locator = page.locator(options.selector).first();
    await locator.waitFor({ state: "visible", timeout: 15_000 });

    if (options.action === "click") {
      await locator.click();
    } else if (options.action === "fill") {
      if (options.value == null) {
        return { ok: false as const, error: "fill requires value." };
      }
      await locator.fill(options.value);
    } else {
      if (!options.value) {
        return { ok: false as const, error: "press requires value (key name, e.g. Enter)." };
      }
      await locator.press(options.value);
    }

    await page.waitForLoadState("domcontentloaded", { timeout: 8_000 }).catch(() => undefined);
    return snapshot(page);
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Browser act failed",
    };
  }
}

export async function skillBrowserSnapshot(skillId: string) {
  try {
    const { page } = await getSession(skillId);
    return snapshot(page);
  } catch (error) {
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Browser snapshot failed",
    };
  }
}
