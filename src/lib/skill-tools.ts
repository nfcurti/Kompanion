import { tool, type ToolSet } from "ai";
import { z } from "zod";

import {
  closeSkillBrowser,
  skillBrowserAct,
  skillBrowserOpen,
  skillBrowserSnapshot,
} from "@/lib/skill-browser";
import { skillLogin, skillFetchPage } from "@/lib/skill-http";
import { skillHasLogin, type Skill } from "@/lib/skills";

export function createSkillWebTools(skills: Skill[]): ToolSet {
  if (skills.length === 0) return {};

  const byId = new Map(skills.map((skill) => [skill.id, skill]));

  function requireSkill(skillId: string) {
    const skill = byId.get(skillId);
    if (!skill) return { skill: null, error: `Unknown skill: ${skillId}` };
    return { skill, error: null };
  }

  return {
    skillLogin: tool({
      description:
        "HTTP form login with credentials stored on a skill. Use for classic server-rendered login forms. Prefer skillBrowserOpen({ login: true }) when the site is a JS app or HTTP login still shows a password field.",
      inputSchema: z.object({
        skillId: z.string().trim().min(1).describe("Skill id that has login configured"),
      }),
      execute: async ({ skillId }) => {
        const { skill, error } = requireSkill(skillId);
        if (!skill) return { ok: false as const, error };
        if (!skillHasLogin(skill)) {
          return {
            ok: false as const,
            error: `Skill ${skillId} has no login URL, username, and password saved.`,
          };
        }
        return skillLogin(skill);
      },
    }),
    skillFetch: tool({
      description:
        "HTTP GET/POST for a skill. Uses the HTTP cookie jar after skillLogin. Use for static HTML. If the body is an empty shell or a login page, switch to skillBrowserOpen.",
      inputSchema: z.object({
        skillId: z
          .string()
          .trim()
          .min(1)
          .describe("Skill id whose session and host allowlist to use"),
        url: z.string().trim().url().describe("Absolute https URL to fetch"),
        method: z.enum(["GET", "POST"]).optional(),
        form: z
          .record(z.string(), z.string())
          .optional()
          .describe("Optional application/x-www-form-urlencoded fields for POST"),
      }),
      execute: async ({ skillId, url, method, form }) => {
        const { skill, error } = requireSkill(skillId);
        if (!skill) return { ok: false as const, error };
        try {
          const result = await skillFetchPage({
            skill,
            url,
            method,
            form,
          });
          return {
            ok: result.ok,
            status: result.status,
            url: result.url,
            contentType: result.contentType,
            truncated: result.truncated,
            body: result.body,
          };
        } catch (err) {
          return {
            ok: false as const,
            error: err instanceof Error ? err.message : "Fetch failed",
          };
        }
      },
    }),
    skillBrowserOpen: tool({
      description:
        "Open a real Chromium session for a skill (JS-rendered pages). HTTPS and host allowlist apply. Set login: true to fill stored credentials on the skill login URL. Call this instead of skillLogin when HTTP login fails.",
      inputSchema: z.object({
        skillId: z.string().trim().min(1),
        url: z
          .string()
          .trim()
          .url()
          .optional()
          .describe("Page to open. Defaults to the skill login URL when login is true."),
        login: z
          .boolean()
          .optional()
          .describe("If true, fill stored username/password on the login page"),
      }),
      execute: async ({ skillId, url, login }) => {
        const { skill, error } = requireSkill(skillId);
        if (!skill) return { ok: false as const, error };
        return skillBrowserOpen({ skill, url, login });
      },
    }),
    skillBrowserAct: tool({
      description:
        "Click, fill, press a key, or navigate in the skill's open browser. Selector is CSS. After login, use this to reach listings. Do not pass passwords; stored login uses skillBrowserOpen({ login: true }).",
      inputSchema: z.object({
        skillId: z.string().trim().min(1),
        action: z.enum(["click", "fill", "press", "goto"]),
        selector: z
          .string()
          .trim()
          .min(1)
          .optional()
          .describe("CSS selector for click/fill/press"),
        value: z
          .string()
          .optional()
          .describe("Text for fill, key name for press (e.g. Enter), URL for goto"),
      }),
      execute: async ({ skillId, action, selector, value }) => {
        const { skill, error } = requireSkill(skillId);
        if (!skill) return { ok: false as const, error };
        return skillBrowserAct({ skill, action, selector, value });
      },
    }),
    skillBrowserSnapshot: tool({
      description:
        "Read the current browser page as a compact accessibility/text snapshot. Prefer this over skillFetch after skillBrowserOpen.",
      inputSchema: z.object({
        skillId: z.string().trim().min(1),
      }),
      execute: async ({ skillId }) => {
        const { error } = requireSkill(skillId);
        if (error) return { ok: false as const, error };
        return skillBrowserSnapshot(skillId);
      },
    }),
    skillBrowserClose: tool({
      description: "Close the skill's Chromium session when the task is done.",
      inputSchema: z.object({
        skillId: z.string().trim().min(1),
      }),
      execute: async ({ skillId }) => {
        const { error } = requireSkill(skillId);
        if (error) return { ok: false as const, error };
        await closeSkillBrowser(skillId);
        return { ok: true as const };
      },
    }),
  };
}
