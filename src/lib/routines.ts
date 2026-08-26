/**
 * LangGraph-level schema for a routine.
 *
 * A routine is a repeating task owned by one agent. Studio (the orchestrator)
 * is never a node. The compiled graph always looks like:
 *
 *   START → gate → perform → persist → END
 *                ↘ persist (on gate failure)
 *
 *   gate     Agent is Active and has at least one capability.
 *   perform  That agent runs with all of their attached capabilities.
 *   persist  Write tick state (output, error, nextRunAt).
 */

export const ROUTINE_GRAPH_START = "START";
export const ROUTINE_GRAPH_END = "END";

export type RoutineStatus = "draft" | "active" | "paused";

export type RoutineIntervalMinutes = 15 | 60 | 360 | 1440;

export const ROUTINE_INTERVALS: {
  minutes: RoutineIntervalMinutes;
  label: string;
}[] = [
  { minutes: 15, label: "Every 15 minutes" },
  { minutes: 60, label: "Every hour" },
  { minutes: 360, label: "Every 6 hours" },
  { minutes: 1440, label: "Every day" },
];

export type RoutineNodeType = "gate" | "perform" | "persist";

export type RoutineNodeId = "gate" | "perform" | "persist";

export type RoutineGraphNode = {
  id: RoutineNodeId;
  type: RoutineNodeType;
  label: string;
};

export type RoutineGraphEdge = {
  source: typeof ROUTINE_GRAPH_START | RoutineNodeId;
  target: RoutineNodeId | typeof ROUTINE_GRAPH_END;
  condition: "always" | "ready" | "blocked" | "done";
};

export type RoutineCompiledGraph = {
  entry: RoutineNodeId;
  nodes: RoutineGraphNode[];
  edges: RoutineGraphEdge[];
};

/** Channels on the graph state, LangGraph LastValue style. */
export type RoutineGraphState = {
  tick: number;
  currentNode: RoutineNodeId | typeof ROUTINE_GRAPH_END | null;
  lastStatus: "idle" | "running" | "ok" | "error";
  lastOutput: string | null;
  lastError: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
};

export type Routine = {
  id: string;
  name: string;
  description: string;
  status: RoutineStatus;
  /** Owner. Never Studio. */
  agentId: string;
  /** Task text handed to the agent on each tick. */
  prompt: string;
  intervalMinutes: RoutineIntervalMinutes;
  timezone: string;
  graph: RoutineCompiledGraph;
  state: RoutineGraphState;
  createdAt: string;
  updatedAt: string;
};

export const CAPABILITY_ROUTINE_GRAPH: RoutineCompiledGraph = {
  entry: "gate",
  nodes: [
    { id: "gate", type: "gate", label: "Gate" },
    { id: "perform", type: "perform", label: "Perform" },
    { id: "persist", type: "persist", label: "Persist" },
  ],
  edges: [
    { source: ROUTINE_GRAPH_START, target: "gate", condition: "always" },
    { source: "gate", target: "perform", condition: "ready" },
    { source: "gate", target: "persist", condition: "blocked" },
    { source: "perform", target: "persist", condition: "done" },
    { source: "persist", target: ROUTINE_GRAPH_END, condition: "always" },
  ],
};

export function compileCapabilityRoutineGraph(): RoutineCompiledGraph {
  return {
    entry: CAPABILITY_ROUTINE_GRAPH.entry,
    nodes: CAPABILITY_ROUTINE_GRAPH.nodes.map((node) => ({ ...node })),
    edges: CAPABILITY_ROUTINE_GRAPH.edges.map((edge) => ({ ...edge })),
  };
}

export function emptyRoutineState(): RoutineGraphState {
  return {
    tick: 0,
    currentNode: null,
    lastStatus: "idle",
    lastOutput: null,
    lastError: null,
    lastRunAt: null,
    nextRunAt: null,
  };
}

export function intervalLabel(minutes: number): string {
  return (
    ROUTINE_INTERVALS.find((item) => item.minutes === minutes)?.label ??
    `Every ${minutes} minutes`
  );
}

export function computeNextRunAt(
  from: Date,
  intervalMinutes: RoutineIntervalMinutes,
): string {
  return new Date(from.getTime() + intervalMinutes * 60_000).toISOString();
}

export function isRoutineInterval(
  value: number,
): value is RoutineIntervalMinutes {
  return ROUTINE_INTERVALS.some((item) => item.minutes === value);
}

export function nextGraphNode(
  graph: RoutineCompiledGraph,
  from: typeof ROUTINE_GRAPH_START | RoutineNodeId,
  condition: RoutineGraphEdge["condition"],
): RoutineNodeId | typeof ROUTINE_GRAPH_END | null {
  const match = graph.edges.find(
    (edge) => edge.source === from && edge.condition === condition,
  );
  return match?.target ?? null;
}
