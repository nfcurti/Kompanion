import type { AgentManifest } from "@/agents/types";
import { getSkill } from "@/lib/skills-registry";
import type { Skill } from "@/lib/skills";

/** Resolve an agent's skill ids to skill records (skips missing ids). */
export function resolveAgentSkills(agent: AgentManifest): Skill[] {
  const skills: Skill[] = [];
  const seen = new Set<string>();

  for (const skillId of agent.capabilities ?? []) {
    if (!skillId || seen.has(skillId)) continue;
    seen.add(skillId);
    const skill = getSkill(skillId);
    if (skill) skills.push(skill);
  }

  return skills;
}

/**
 * Compose the full instructions for a specialist agent:
 * persona + attached skill bodies (SKILL.md-style injection).
 */
export function composeAgentInstructions(agent: AgentManifest): string {
  const skills = resolveAgentSkills(agent);
  const lines: string[] = [
    `You are ${agent.name} (${agent.id}), a specialist agent in Kompanion.`,
    "",
    agent.description.trim(),
  ];

  if (skills.length === 0) {
    lines.push(
      "",
      "No skills are attached. Follow the agent description and complete the task carefully.",
    );
    return lines.join("\n");
  }

  lines.push("", "## Attached skills", "");
  lines.push(
    "Apply the following skills when they match the task. Prefer skill instructions over improvising. Do not invent URLs; after the first real page, follow links and controls on the site.",
    "User-facing replies are JSON: {status, items, observed}. Each item includes only fields visible on that record; keys may differ. Do not pad missing columns.",
    "",
  );

  for (const skill of skills) {
    lines.push(`### ${skill.id}`, "");
    if (skill.description.trim()) {
      lines.push(`When to use: ${skill.description.trim()}`, "");
    }
    if (skill.auth?.enabled) {
      lines.push(
        `Login: configured for ${skill.auth.loginUrl} as ${skill.auth.username}. Try skillLogin then skillFetch. If fetch redirects away from the requested path or the page is JS-rendered, use skillBrowserOpen({ skillId: "${skill.id}", login: true, url }) with the task URL, then snapshot/act. Never print the password.`,
        "",
      );
    }
    lines.push(skill.instructions.trim(), "");
  }

  return lines.join("\n").trimEnd();
}

/** Isolated playground run: one skill, no persona, no orchestrator routing. */
export function composeSkillTestInstructions(skill: Skill): string {
  const lines: string[] = [
    `You are running an isolated test of skill "${skill.id}" (${skill.name}).`,
    "Apply only this skill. Do not invent page contents, listings, login results, or URLs.",
    "Reply with a single JSON object {status, items, observed}. Each item's keys are whatever that record shows on the page (volatile schema). Omit absent fields; do not use Markdown tables or pad with not listed.",
    "Use skillLogin/skillFetch for static HTML. If login fails, the page is a JS app, or fetch reports reachedRequestedUrl false, use skillBrowserOpen({ skillId, login: true, url }) with the task URL, then snapshot/act. After the first real page, navigate only via links and controls on the page — never guess paths. Fail closed if a page cannot be fetched or parsed.",
    "",
  ];

  if (skill.description.trim()) {
    lines.push(`When to use: ${skill.description.trim()}`, "");
  }

  if (skill.auth?.enabled) {
    lines.push(
      `Login: configured for ${skill.auth.loginUrl} as ${skill.auth.username}. Try skillLogin then skillFetch. If fetch redirects away from the requested path or the page is JS-rendered, call skillBrowserOpen({ skillId: "${skill.id}", login: true, url }) with the task URL, then snapshot/act. Never print the password.`,
      "",
    );
  } else {
    lines.push(
      `No login is stored on this skill. Use skillFetch({ skillId: "${skill.id}", url }) for public HTML, or skillBrowserOpen for JS-rendered public HTTPS pages.`,
      "",
    );
  }

  lines.push(skill.instructions.trim());
  return lines.join("\n").trimEnd();
}

/** Short skill summaries for orchestrator routing (description only). */
export function formatAgentSkillSummaries(agent: AgentManifest): string {
  const skills = resolveAgentSkills(agent);
  if (skills.length === 0) return "none";
  return skills
    .map((skill) => `${skill.id} — ${skill.description}`)
    .join("; ");
}
