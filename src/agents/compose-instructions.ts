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
    "Apply the following skills when they match the task. Prefer skill instructions over improvising.",
    "",
  );

  for (const skill of skills) {
    lines.push(`### ${skill.id}`, "");
    if (skill.description.trim()) {
      lines.push(`When to use: ${skill.description.trim()}`, "");
    }
    lines.push(skill.instructions.trim(), "");
  }

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
