import type { RegisteredAgent } from "@/agents/types";

/**
 * In-memory agent registry.
 * Starts empty — register agents at boot (or later from persistence) via
 * `registerAgent`. The orchestrator only exposes tools for `active` agents.
 */
const agentsById = new Map<string, RegisteredAgent>();

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

export function registerAgent(agent: RegisteredAgent): void {
  agentsById.set(agent.id, agent);
}

export function unregisterAgent(id: string): boolean {
  return agentsById.delete(id);
}

export function getRegistrySnapshot() {
  return listAgents().map(
    ({ id, name, description, status, capabilities }) => ({
      id,
      name,
      description,
      status,
      capabilities,
    }),
  );
}
