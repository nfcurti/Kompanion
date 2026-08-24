import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { skillHasLogin, type Skill } from "@/lib/skills";

type StoredCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
};

const jars = new Map<string, StoredCookie[]>();

const MAX_REDIRECTS = 8;
const MAX_BODY_CHARS = 80_000;
const FETCH_TIMEOUT_MS = 20_000;

function isPrivateIp(ip: string): boolean {
  if (ip.startsWith("::ffff:")) return isPrivateIp(ip.slice(7));
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80")) {
    return true;
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) return false;
  const [a, b] = parts;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

export async function assertPublicHttps(url: URL) {
  if (url.protocol !== "https:") {
    throw new Error("Only https URLs are allowed.");
  }
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname === "0.0.0.0"
  ) {
    throw new Error("That host is not allowed.");
  }
  const ipLiteral = isIP(hostname) ? hostname : null;
  if (ipLiteral) {
    if (isPrivateIp(ipLiteral)) throw new Error("That host is not allowed.");
    return;
  }
  const { address } = await lookup(hostname);
  if (isPrivateIp(address)) throw new Error("That host is not allowed.");
}

export function allowedHostsForSkill(skill: Skill): string[] {
  const hosts = new Set<string>();
  const add = (raw: string | undefined) => {
    if (!raw) return;
    try {
      const host = raw.includes("://")
        ? new URL(raw).hostname
        : raw.split("/")[0];
      const normalized = host?.trim().toLowerCase();
      if (!normalized) return;
      hosts.add(normalized);
      if (normalized.startsWith("www.")) hosts.add(normalized.slice(4));
      else hosts.add(`www.${normalized}`);
    } catch {
      // Ignore malformed host entries.
    }
  };
  add(skill.auth?.loginUrl);
  for (const host of skill.auth?.allowedHosts ?? []) add(host);
  return [...hosts];
}

export function hostAllowed(hostname: string, allowed: string[]): boolean {
  const host = hostname.toLowerCase();
  if (allowed.length === 0) return true;
  return allowed.some(
    (entry) => host === entry || host.endsWith(`.${entry}`),
  );
}

function pageKey(raw: string): { host: string; path: string } | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./i, "").toLowerCase();
    const path = (url.pathname.replace(/\/+$/, "") || "/").toLowerCase();
    return { host, path };
  } catch {
    return null;
  }
}

/** True when final URL is the same host+path as requested (www / trailing slash ignored). */
export function reachedRequestedUrl(requested: string, finalUrl: string): boolean {
  const a = pageKey(requested);
  const b = pageKey(finalUrl);
  if (!a || !b) return requested === finalUrl;
  return a.host === b.host && a.path === b.path;
}

function cookieHeader(jar: StoredCookie[], url: URL): string {
  const host = url.hostname.toLowerCase();
  const path = url.pathname || "/";
  return jar
    .filter((cookie) => {
      const domainOk =
        host === cookie.domain || host.endsWith(`.${cookie.domain}`);
      const pathOk = path.startsWith(cookie.path || "/");
      return domainOk && pathOk;
    })
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

function storeCookies(skillId: string, url: URL, headers: Headers) {
  const jar = jars.get(skillId) ?? [];
  const next = [...jar];
  const raw =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : headers.get("set-cookie")
        ? [headers.get("set-cookie") as string]
        : [];
  for (const line of raw) {
    const [pair] = line.split(";");
    const eq = pair?.indexOf("=") ?? -1;
    if (eq <= 0) continue;
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    if (!name) continue;
    const domainMatch = /(?:^|;)\s*domain=([^;]+)/i.exec(line);
    const pathMatch = /(?:^|;)\s*path=([^;]+)/i.exec(line);
    const domain = (domainMatch?.[1] ?? url.hostname)
      .trim()
      .replace(/^\./, "")
      .toLowerCase();
    const path = (pathMatch?.[1] ?? "/").trim() || "/";
    const index = next.findIndex(
      (cookie) => cookie.name === name && cookie.domain === domain,
    );
    const cookie = { name, value, domain, path };
    if (index >= 0) next[index] = cookie;
    else next.push(cookie);
  }
  jars.set(skillId, next);
}

function decodeEntities(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function attr(tag: string, name: string): string | undefined {
  const match = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "i").exec(
    tag,
  );
  const value = match?.[2] ?? match?.[3] ?? match?.[4];
  return value ? decodeEntities(value) : undefined;
}

function parseLoginForm(html: string, pageUrl: URL) {
  const forms = html.match(/<form\b[\s\S]*?<\/form>/gi) ?? [];
  const formHtml =
    forms.find((block) => /type\s*=\s*["']?password/i.test(block)) ?? forms[0];
  if (!formHtml) return null;

  const openTag = formHtml.match(/<form\b[^>]*>/i)?.[0] ?? "";
  const action = attr(openTag, "action");
  const method = (attr(openTag, "method") ?? "post").toLowerCase();
  const actionUrl = new URL(action || pageUrl.href, pageUrl);

  const fields: Record<string, string> = {};
  let usernameField: string | undefined;
  let passwordField: string | undefined;

  const inputs = formHtml.match(/<input\b[^>]*>/gi) ?? [];
  for (const input of inputs) {
    const type = (attr(input, "type") ?? "text").toLowerCase();
    if (type === "submit" || type === "button" || type === "image") continue;
    const name = attr(input, "name");
    if (!name) continue;
    const value = attr(input, "value") ?? "";
    fields[name] = value;
    if (type === "password") passwordField = name;
    if (
      !usernameField &&
      (type === "email" ||
        /email|user|login|account/i.test(name) ||
        type === "text")
    ) {
      usernameField = name;
    }
  }

  return {
    actionUrl,
    method: method === "get" ? "GET" : "POST",
    fields,
    usernameField,
    passwordField,
  };
}

export type SkillFetchResult = {
  ok: boolean;
  status: number;
  requestedUrl: string;
  url: string;
  redirected: boolean;
  reachedRequestedUrl: boolean;
  contentType: string;
  body: string;
  truncated: boolean;
  warning?: string;
};

async function requestWithJar(options: {
  skillId: string;
  url: URL;
  method: string;
  body?: URLSearchParams;
  allowed: string[];
}): Promise<SkillFetchResult> {
  let current = options.url;
  let method = options.method;
  let body = options.body;

  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    await assertPublicHttps(current);
    if (!hostAllowed(current.hostname, options.allowed)) {
      throw new Error(
        `Host ${current.hostname} is not allowed for this skill.`,
      );
    }

    const jar = jars.get(options.skillId) ?? [];
    const headers: Record<string, string> = {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent":
        "KompanionSkill/1.0 (+https://github.com/nfcurti/Kompanion)",
    };
    const cookies = cookieHeader(jar, current);
    if (cookies) headers.Cookie = cookies;
    if (body && method !== "GET") {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
    }

    const response = await fetch(current, {
      method,
      headers,
      body: method === "GET" ? undefined : body,
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    storeCookies(options.skillId, current, response.headers);

    const location = response.headers.get("location");
    if (
      location &&
      [301, 302, 303, 307, 308].includes(response.status) &&
      i < MAX_REDIRECTS
    ) {
      current = new URL(location, current);
      if (response.status === 303 || response.status === 302) {
        method = "GET";
        body = undefined;
      }
      continue;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();
    const truncated = text.length > MAX_BODY_CHARS;
    const requestedUrl = options.url.href;
    const reached = reachedRequestedUrl(requestedUrl, current.href);
    return {
      ok: response.ok,
      status: response.status,
      requestedUrl,
      url: current.href,
      redirected: !reached,
      reachedRequestedUrl: reached,
      contentType,
      body: truncated ? `${text.slice(0, MAX_BODY_CHARS)}\n…[truncated]` : text,
      truncated,
      warning: reached
        ? undefined
        : `HTTP ended on ${current.href}, not the requested path ${requestedUrl}. This page is not the one you asked for.`,
    };
  }

  throw new Error("Too many redirects.");
}

export async function skillFetchPage(options: {
  skill: Skill;
  url: string;
  method?: "GET" | "POST";
  form?: Record<string, string>;
}): Promise<SkillFetchResult> {
  const allowed = allowedHostsForSkill(options.skill);
  const url = new URL(options.url);
  const method = options.method ?? "GET";
  const body =
    method === "POST" && options.form
      ? new URLSearchParams(options.form)
      : undefined;
  return requestWithJar({
    skillId: options.skill.id,
    url,
    method,
    body,
    allowed,
  });
}

export async function skillLogin(skill: Skill): Promise<{
  ok: boolean;
  status: number;
  url: string;
  requestedUrl: string;
  message: string;
}> {
  if (!skillHasLogin(skill) || !skill.auth) {
    return {
      ok: false,
      status: 0,
      url: "",
      requestedUrl: "",
      message: "This skill has no login configured.",
    };
  }

  const loginUrl = new URL(skill.auth.loginUrl);
  const allowed = allowedHostsForSkill(skill);
  const page = await requestWithJar({
    skillId: skill.id,
    url: loginUrl,
    method: "GET",
    allowed,
  });

  const form = parseLoginForm(page.body, new URL(page.url));
  const fields = { ...(form?.fields ?? {}) };
  const usernameField =
    form?.usernameField ??
    Object.keys(fields).find((name) => /email|user|login/i.test(name)) ??
    "email";
  const passwordField =
    form?.passwordField ??
    Object.keys(fields).find((name) => /pass/i.test(name)) ??
    "password";
  fields[usernameField] = skill.auth.username;
  fields[passwordField] = skill.auth.password;

  const actionUrl = form?.actionUrl ?? loginUrl;
  const submitted = await requestWithJar({
    skillId: skill.id,
    url: actionUrl,
    method: "POST",
    body: new URLSearchParams(fields),
    allowed,
  });

  const loggedIn = submitted.status === 200;

  return {
    ok: loggedIn,
    status: submitted.status,
    url: submitted.url,
    requestedUrl: loginUrl.href,
    message: loggedIn
      ? `Login POST returned HTTP 200. Session cookies stored for ${skill.id}. The current URL is often an account home, not the task page — fetch or open the canonical URL next.`
      : `Login POST returned HTTP ${submitted.status}.`,
  };
}
