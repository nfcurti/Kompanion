import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { slugifyAgentId } from "@/lib/agent-id";
import type { Skill } from "@/lib/skills";

export { slugifyAgentId as slugifySkillId };

const DATA_DIR = path.join(process.cwd(), "data");
const SKILLS_FILE = path.join(DATA_DIR, "skills.json");

const skillsById = new Map<string, Skill>();

function loadFromDisk() {
  if (!existsSync(SKILLS_FILE)) return;
  try {
    const raw = readFileSync(SKILLS_FILE, "utf8");
    const parsed = JSON.parse(raw) as Skill[];
    if (!Array.isArray(parsed)) return;
    for (const skill of parsed) {
      if (!skill?.id || !skill?.name) continue;
      skillsById.set(skill.id, {
        id: skill.id,
        name: skill.name,
        description: skill.description ?? "",
        instructions: skill.instructions ?? "",
      });
    }
  } catch {
    // Ignore corrupt store; start empty.
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    SKILLS_FILE,
    `${JSON.stringify(listSkills(), null, 2)}\n`,
    "utf8",
  );
}

loadFromDisk();

export function listSkills(): Skill[] {
  return Array.from(skillsById.values()).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
}

export function getSkill(id: string): Skill | undefined {
  return skillsById.get(id);
}

export function registerSkill(skill: Skill): Skill {
  if (skillsById.has(skill.id)) {
    throw new Error(`Skill already exists: ${skill.id}`);
  }
  skillsById.set(skill.id, skill);
  saveToDisk();
  return skill;
}

export function updateSkill(
  id: string,
  patch: Partial<Omit<Skill, "id">>,
): Skill {
  const existing = skillsById.get(id);
  if (!existing) {
    throw new Error(`Skill not found: ${id}`);
  }
  const next: Skill = { ...existing, ...patch, id };
  skillsById.set(id, next);
  saveToDisk();
  return next;
}

export function unregisterSkill(id: string): boolean {
  const removed = skillsById.delete(id);
  if (removed) saveToDisk();
  return removed;
}
