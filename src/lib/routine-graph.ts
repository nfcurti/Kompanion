import { resolveAgentSkills } from "@/agents/compose-instructions";
import { runAgentRoutine } from "@/agents/invoke-agent";
import { getAgent } from "@/agents/registry";
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

const running = new Set<string>();

type NodeOutcome = {
  condition: "always" | "ready" | "blocked" | "done";
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
    return {
      condition: "done",
      patch: {
        lastStatus: "error",
        lastError: result.error ?? "Perform failed",
        lastOutput: null,
      },
    };
  }

  return {
    condition: "done",
    patch: {
      lastStatus: "ok",
      lastError: null,
      lastOutput: result.text?.trim() || "Done",
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
          ? computeNextRunAt(now, routine.intervalMinutes)
          : null,
      currentNode: ROUTINE_GRAPH_END,
      lastStatus: state.lastStatus === "running" ? "ok" : state.lastStatus,
    },
  };
}

/**
 * Invoke the compiled capability graph for one tick.
 * START → gate → perform → persist → END
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
          ? computeNextRunAt(new Date(), routine.intervalMinutes)
          : null,
    });
  } finally {
    running.delete(routine.id);
  }
}
