import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { getAgent } from "@/agents/registry";
import { slugifyAgentId } from "@/lib/agent-id";
import {
  compileCapabilityRoutineGraph,
  computeNextRunAt,
  emptyRoutineState,
  isRoutineInterval,
  type Routine,
  type RoutineGraphState,
  type RoutineIntervalMinutes,
  type RoutineStatus,
} from "@/lib/routines";

const DATA_DIR = path.join(process.cwd(), "data");
const ROUTINES_FILE = path.join(DATA_DIR, "routines.json");

const routinesById = new Map<string, Routine>();

function loadFromDisk() {
  if (!existsSync(ROUTINES_FILE)) return;
  try {
    const raw = readFileSync(ROUTINES_FILE, "utf8");
    const parsed = JSON.parse(raw) as Routine[];
    if (!Array.isArray(parsed)) return;
    for (const routine of parsed) {
      if (!routine?.id || !routine?.agentId) continue;
      const leftover = routine as Routine & { capabilityId?: string };
      const { capabilityId: _dropped, ...rest } = leftover;
      routinesById.set(routine.id, {
        ...rest,
        graph: compileCapabilityRoutineGraph(),
        state: { ...emptyRoutineState(), ...routine.state },
      });
    }
  } catch {
    // Ignore corrupt store.
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    ROUTINES_FILE,
    `${JSON.stringify(listRoutines(), null, 2)}\n`,
    "utf8",
  );
}

loadFromDisk();

export function listRoutines(): Routine[] {
  return Array.from(routinesById.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getRoutine(id: string): Routine | undefined {
  return routinesById.get(id);
}

export function listDueRoutines(now = new Date()): Routine[] {
  const iso = now.toISOString();
  return listRoutines().filter(
    (routine) =>
      routine.status === "active" &&
      routine.state.lastStatus !== "running" &&
      routine.state.nextRunAt != null &&
      routine.state.nextRunAt <= iso,
  );
}

export type CreateRoutineInput = {
  name: string;
  description?: string;
  agentId: string;
  prompt: string;
  intervalMinutes: RoutineIntervalMinutes;
  status?: RoutineStatus;
  timezone?: string;
};

export function assertRoutineAgent(agentId: string) {
  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  if (agent.capabilities.length === 0) {
    throw new Error(
      `${agent.id} has no capabilities. Attach at least one first.`,
    );
  }
  return { agent };
}

export function registerRoutine(input: CreateRoutineInput): Routine {
  const name = input.name.trim();
  const idBase = slugifyAgentId(name);
  if (!idBase) {
    throw new Error("Enter a valid routine name");
  }

  let id = idBase;
  let suffix = 2;
  while (routinesById.has(id)) {
    id = `${idBase}-${suffix}`;
    suffix += 1;
  }

  assertRoutineAgent(input.agentId);

  const now = new Date();
  const status = input.status ?? "draft";
  const intervalMinutes = input.intervalMinutes;
  const state = emptyRoutineState();
  if (status === "active") {
    state.nextRunAt = computeNextRunAt(now, intervalMinutes);
  }

  const routine: Routine = {
    id,
    name,
    description: input.description?.trim() ?? "",
    status,
    agentId: input.agentId,
    prompt: input.prompt.trim(),
    intervalMinutes,
    timezone: input.timezone?.trim() || "UTC",
    graph: compileCapabilityRoutineGraph(),
    state,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  routinesById.set(id, routine);
  saveToDisk();
  return routine;
}

export function updateRoutine(
  id: string,
  patch: Partial<
    Pick<
      Routine,
      | "name"
      | "description"
      | "status"
      | "agentId"
      | "prompt"
      | "intervalMinutes"
      | "timezone"
    >
  > & { state?: Partial<RoutineGraphState> },
): Routine {
  const existing = routinesById.get(id);
  if (!existing) {
    throw new Error(`Routine not found: ${id}`);
  }

  const agentId = patch.agentId ?? existing.agentId;
  if (patch.agentId != null) {
    assertRoutineAgent(agentId);
  }

  const intervalMinutes = patch.intervalMinutes ?? existing.intervalMinutes;
  if (!isRoutineInterval(intervalMinutes)) {
    throw new Error("Unsupported interval");
  }

  const nextStatus = patch.status ?? existing.status;
  const state: RoutineGraphState = {
    ...existing.state,
    ...patch.state,
  };

  if (patch.status === "active" && existing.status !== "active") {
    state.nextRunAt = computeNextRunAt(new Date(), intervalMinutes);
  }
  if (patch.status === "paused" || patch.status === "draft") {
    if (state.lastStatus !== "running") {
      state.nextRunAt = null;
    }
  }

  const next: Routine = {
    ...existing,
    name: patch.name?.trim() || existing.name,
    description:
      patch.description !== undefined
        ? patch.description.trim()
        : existing.description,
    status: nextStatus,
    agentId,
    prompt: patch.prompt?.trim() || existing.prompt,
    intervalMinutes,
    timezone: patch.timezone?.trim() || existing.timezone,
    graph: compileCapabilityRoutineGraph(),
    state,
    updatedAt: new Date().toISOString(),
  };

  routinesById.set(id, next);
  saveToDisk();
  return next;
}

export function saveRoutineState(
  id: string,
  state: RoutineGraphState,
): Routine {
  const existing = routinesById.get(id);
  if (!existing) {
    throw new Error(`Routine not found: ${id}`);
  }
  const next: Routine = {
    ...existing,
    state,
    updatedAt: new Date().toISOString(),
  };
  routinesById.set(id, next);
  saveToDisk();
  return next;
}

export function unregisterRoutine(id: string): boolean {
  const removed = routinesById.delete(id);
  if (removed) saveToDisk();
  return removed;
}
