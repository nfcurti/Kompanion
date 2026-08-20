import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import type { AgentManifest, RegisteredAgent } from "@/agents/types";
import { slugifyAgentId } from "@/lib/agent-id";

export { slugifyAgentId };

const DATA_DIR = path.join(process.cwd(), "data");
const AGENTS_FILE = path.join(DATA_DIR, "agents.json");

/**
 * In-memory agent registry with JSON persistence for manifests.
 * `createTools` is runtime-only and is not persisted.
 */
const agentsById = new Map<string, RegisteredAgent>();

function toManifest(agent: RegisteredAgent): AgentManifest {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    status: agent.status,
    capabilities: agent.capabilities,
    model: agent.model,
  };
}

function loadFromDisk() {
  if (!existsSync(AGENTS_FILE)) return;
  try {
    const raw = readFileSync(AGENTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as AgentManifest[];
    if (!Array.isArray(parsed)) return;
    for (const agent of parsed) {
      if (!agent?.id || !agent?.name) continue;
      agentsById.set(agent.id, {
        id: agent.id,
        name: agent.name,
        description: agent.description ?? "",
        status: agent.status ?? "registered",
        capabilities: Array.isArray(agent.capabilities)
          ? agent.capabilities
          : [],
        model: agent.model,
      });
    }
  } catch {
    // Ignore corrupt store; start empty.
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  const manifests = listAgents().map(toManifest);
  writeFileSync(AGENTS_FILE, `${JSON.stringify(manifests, null, 2)}\n`, "utf8");
}

loadFromDisk();

export function listAgents(): RegisteredAgent[] {
  return Array.from(agentsById.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

export function getAgent(id: string): RegisteredAgent | undefined {
  return agentsById.get(id);
}

export function listActiveAgents(): RegisteredAgent[] {
  return listAgents().filter((agent) => agent.status === "active");
}

export function registerAgent(agent: RegisteredAgent): RegisteredAgent {
  if (agentsById.has(agent.id)) {
    throw new Error(`Agent already exists: ${agent.id}`);
  }
  agentsById.set(agent.id, agent);
  saveToDisk();
  return agent;
}

export function updateAgent(
  id: string,
  patch: Partial<Omit<RegisteredAgent, "id" | "createTools">>,
): RegisteredAgent {
  const existing = agentsById.get(id);
  if (!existing) {
    throw new Error(`Agent not found: ${id}`);
  }
  const next: RegisteredAgent = {
    ...existing,
    ...patch,
    id,
    createTools: existing.createTools,
  };
  agentsById.set(id, next);
  saveToDisk();
  return next;
}

export function unregisterAgent(id: string): boolean {
  const removed = agentsById.delete(id);
  if (removed) saveToDisk();
  return removed;
}

export function getRegistrySnapshot(): AgentManifest[] {
  return listAgents().map(toManifest);
}
