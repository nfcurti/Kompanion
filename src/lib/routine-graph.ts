import { resolveAgentSkills } from "@/agents/compose-instructions";
import { runAgentRoutine } from "@/agents/invoke-agent";
import { getAgent } from "@/agents/registry";
import { listSeenLeadKeys, rememberLeadKeys } from "@/lib/leads-seen-store";
import {
  leadItemKey,
  parseLeadOutput,
  textOutputKey,
  type LeadItem,
} from "@/lib/routine-leads";
import {
  computeNextRunAt,
  nextGraphNode,
  ROUTINE_GRAPH_END,
  ROUTINE_GRAPH_START,
  type Routine,
  type RoutineGraphState,
  type RoutineNodeId,
} from "@/lib/routines";
import { saveRoutineState } from "@/lib/routines-registry";
import { enqueueStudioActivity } from "@/lib/studio-inbox-store";

const running = new Set<string>();

type NodeOutcome = {
  condition: "always" | "ready" | "blocked" | "done" | "ok" | "error";
  patch: Partial<RoutineGraphState>;
};

function mergeState(
  state: RoutineGraphState,
  patch: Partial<RoutineGraphState>,
): RoutineGraphState {
  return { ...state, ...patch };
}

async function runGate(routine: Routine): Promise<NodeOutcome> {
  const agent = getAgent(routine.agentId);

  if (!agent) {
    return {
      condition: "blocked",
      patch: {
        lastStatus: "error",
        lastError: `Agent not found: ${routine.agentId}`,
        lastOutput: null,
      },
    };
  }

  if (agent.status !== "active") {
    return {
      condition: "blocked",
      patch: {
        lastStatus: "error",
        lastError: `${agent.id} is ${agent.status}, not Active.`,
        lastOutput: null,
      },
    };
  }

  const skills = resolveAgentSkills(agent);
  if (skills.length === 0) {
    return {
      condition: "blocked",
      patch: {
        lastStatus: "error",
        lastError: `${agent.id} has no capabilities.`,
        lastOutput: null,
      },
    };
  }

  return {
    condition: "ready",
    patch: { lastError: null },
  };
}

async function runPerform(
  routine: Routine,
  abortSignal?: AbortSignal,
): Promise<NodeOutcome> {
  const result = await runAgentRoutine({
    agentId: routine.agentId,
    prompt: routine.prompt,
    abortSignal,
  });

  if (!result.ok) {
    if (routine.callback === "orchestrator") {
      const agent = getAgent(routine.agentId);
      enqueueStudioActivity({
        kind: "routine",
        title: routine.name,
        agentId: routine.agentId,
        agentName: agent?.name ?? routine.agentId,
        output: result.error ?? "Perform failed",
      });
    }
    return {
      condition: "error",
      patch: {
        lastStatus: "error",
        lastError: result.error ?? "Perform failed",
        lastOutput: null,
        lastCallbackOutput: null,
      },
    };
  }

  const output = result.text?.trim() || "Done";
  return {
    condition: "ok",
    patch: {
      lastStatus: "ok",
      lastError: null,
      lastOutput: output,
      lastCallbackOutput: null,
    },
  };
}

async function runCallback(
  routine: Routine,
  state: RoutineGraphState,
): Promise<NodeOutcome> {
  if (routine.callback !== "orchestrator") {
    return {
      condition: "always",
      patch: { lastCallbackOutput: null },
    };
  }

  const agent = getAgent(routine.agentId);
  const raw = state.lastOutput?.trim() ?? "";
  const parsed = parseLeadOutput(raw);

  if (!parsed) {
    const key = textOutputKey(raw || "Done");
    if (listSeenLeadKeys(routine.agentId).has(key)) {
      return {
        condition: "always",
        patch: { lastCallbackOutput: "No new items" },
      };
    }
    enqueueStudioActivity({
      kind: "routine",
      title: routine.name,
      agentId: routine.agentId,
      agentName: agent?.name ?? routine.agentId,
      output: raw || "Done",
    });
    rememberLeadKeys(routine.agentId, [key]);
    return {
      condition: "always",
      patch: {
        lastStatus: "ok",
        lastError: null,
        lastCallbackOutput: "Reported to Studio",
      },
    };
  }

  if (parsed.items.length === 0) {
    return {
      condition: "always",
      patch: { lastCallbackOutput: "No new items" },
    };
  }

  const seen = listSeenLeadKeys(routine.agentId);
  const keys = parsed.items.map(leadItemKey);

  const fresh: LeadItem[] = [];
  const freshKeys: string[] = [];
  parsed.items.forEach((item, index) => {
    const key = keys[index];
    if (seen.has(key) || freshKeys.includes(key)) return;
    fresh.push(item);
    freshKeys.push(key);
  });

  if (fresh.length === 0) {
    return {
      condition: "always",
      patch: { lastCallbackOutput: "No new items" },
    };
  }

  const observed =
    parsed.observed &&
    typeof parsed.observed === "object" &&
    !Array.isArray(parsed.observed)
      ? (parsed.observed as Record<string, unknown>)
      : {};

  enqueueStudioActivity({
    kind: "routine",
    title: routine.name,
    agentId: routine.agentId,
    agentName: agent?.name ?? routine.agentId,
    output: JSON.stringify({
      status: "ok",
      items: fresh,
      observed: {
        ...observed,
        newCount: fresh.length,
        scannedCount: parsed.items.length,
      },
    }),
  });
  rememberLeadKeys(routine.agentId, freshKeys);

  return {
    condition: "always",
    patch: {
      lastStatus: "ok",
      lastError: null,
      lastCallbackOutput: `Reported ${fresh.length} new item(s) to Studio`,
    },
  };
}

function runPersist(
  routine: Routine,
  state: RoutineGraphState,
): NodeOutcome {
  const now = new Date();
  return {
    condition: "always",
    patch: {
      lastRunAt: now.toISOString(),
      nextRunAt:
        routine.status === "active"
          ? computeNextRunAt(now, routine.cadenceSeconds)
          : null,
      currentNode: ROUTINE_GRAPH_END,
      lastStatus: state.lastStatus === "running" ? "ok" : state.lastStatus,
    },
  };
}

/**
 * Invoke the compiled capability graph for one tick.
 * START → gate → perform → callback → persist → END
 */
export async function invokeRoutineGraph(
  routine: Routine,
  abortSignal?: AbortSignal,
): Promise<Routine> {
  if (running.has(routine.id) || routine.state.lastStatus === "running") {
    return routine;
  }

  running.add(routine.id);

  let state: RoutineGraphState = {
    ...routine.state,
    tick: routine.state.tick + 1,
    currentNode: "gate",
    lastStatus: "running",
    lastError: null,
  };
  saveRoutineState(routine.id, state);

  try {
    let node: RoutineNodeId | typeof ROUTINE_GRAPH_END | null =
      routine.graph.entry;
    let from: typeof ROUTINE_GRAPH_START | RoutineNodeId = ROUTINE_GRAPH_START;

    while (node && node !== ROUTINE_GRAPH_END) {
      abortSignal?.throwIfAborted();
      state = mergeState(state, { currentNode: node });
      saveRoutineState(routine.id, state);

      let outcome: NodeOutcome;
      if (node === "gate") {
        outcome = await runGate(routine);
      } else if (node === "perform") {
        outcome = await runPerform(routine, abortSignal);
      } else if (node === "callback") {
        outcome = await runCallback(routine, state);
      } else {
        outcome = runPersist(routine, mergeState(state, {}));
      }

      state = mergeState(state, outcome.patch);
      from = node;
      node = nextGraphNode(routine.graph, from, outcome.condition);
    }

    state = mergeState(state, { currentNode: ROUTINE_GRAPH_END });
    return saveRoutineState(routine.id, state);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Routine graph failed";
    return saveRoutineState(routine.id, {
      ...state,
      currentNode: ROUTINE_GRAPH_END,
      lastStatus: "error",
      lastError: message,
      lastRunAt: new Date().toISOString(),
      nextRunAt:
        routine.status === "active"
          ? computeNextRunAt(new Date(), routine.cadenceSeconds)
          : null,
    });
  } finally {
    running.delete(routine.id);
  }
}
