import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import { getAgent } from "@/agents/registry";
import { slugifyAgentId } from "@/lib/agent-id";
import {
  cadenceFromLegacyMinutes,
  compileRoutineGraph,
  computeNextRunAt,
  emptyRoutineState,
  isRoutineCadence,
  normalizeRoutineCallback,
  type Routine,
  type RoutineCadenceSeconds,
  type RoutineCallbackKind,
  type RoutineGraphState,
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
      const leftover = routine as Routine & {
        capabilityId?: string;
        intervalMinutes?: number;
        cadenceSeconds?: number;
      };
      const { capabilityId: _dropped, intervalMinutes, ...rest } = leftover;
      const cadenceSeconds =
        leftover.cadenceSeconds != null &&
        isRoutineCadence(leftover.cadenceSeconds)
          ? leftover.cadenceSeconds
          : intervalMinutes != null
            ? (cadenceFromLegacyMinutes(intervalMinutes) ?? 3600)
            : 3600;
      const callback = normalizeRoutineCallback(leftover.callback);
      routinesById.set(routine.id, {
        ...rest,
        callback,
        cadenceSeconds,
        graph: compileRoutineGraph(callback),
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
  callback?: RoutineCallbackKind | "";
  cadenceSeconds: RoutineCadenceSeconds;
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
  const cadenceSeconds = input.cadenceSeconds;
  const callback = normalizeRoutineCallback(input.callback);
  const state = emptyRoutineState();
  if (status === "active") {
    state.nextRunAt = computeNextRunAt(now, cadenceSeconds);
  }

  const routine: Routine = {
    id,
    name,
    description: input.description?.trim() ?? "",
    status,
    agentId: input.agentId,
    prompt: input.prompt.trim(),
    callback,
    cadenceSeconds,
    timezone: input.timezone?.trim() || "UTC",
    graph: compileRoutineGraph(callback),
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
      | "callback"
      | "cadenceSeconds"
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

  const cadenceSeconds = patch.cadenceSeconds ?? existing.cadenceSeconds;
  if (!isRoutineCadence(cadenceSeconds)) {
    throw new Error("Unsupported cadence");
  }

  const nextStatus = patch.status ?? existing.status;
  const state: RoutineGraphState = {
    ...existing.state,
    ...patch.state,
  };

  if (patch.status === "active" && existing.status !== "active") {
    state.nextRunAt = computeNextRunAt(new Date(), cadenceSeconds);
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
    callback:
      patch.callback !== undefined
        ? normalizeRoutineCallback(patch.callback)
        : existing.callback,
    cadenceSeconds,
    timezone: patch.timezone?.trim() || existing.timezone,
    graph: compileRoutineGraph(
      patch.callback !== undefined
        ? normalizeRoutineCallback(patch.callback)
        : existing.callback,
    ),
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
