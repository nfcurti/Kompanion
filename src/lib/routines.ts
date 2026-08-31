/**
 * LangGraph-level schema for a routine.
 *
 * A routine is a repeating task owned by one agent. Studio (the orchestrator)
 * is never a node. The compiled graph always looks like:
 *
 *   START → gate → perform → callback → persist → END
 *                ↘ persist (on gate failure)
 *                         ↘ persist (on perform failure, or if no callback)
 *
 *   gate      Agent is Active and has at least one capability.
 *   perform   That agent runs with all of their attached capabilities.
 *   callback  Optional. After perform, a named action on the result.
 *   persist   Write tick state (output, error, nextRunAt).
 */

export const ROUTINE_GRAPH_START = "START";
export const ROUTINE_GRAPH_END = "END";

export type RoutineStatus = "draft" | "active" | "paused";

/** How often a routine runs. Live is sub-minute; the rest are scheduled. */
export type RoutineCadenceSeconds = 5 | 900 | 3600 | 21600 | 86400;

export const LIVE_CADENCE_SECONDS = 5 as const;

export const ROUTINE_CADENCES: {
  seconds: RoutineCadenceSeconds;
  label: string;
  detail: string;
}[] = [
  { seconds: 5, label: "Live", detail: "Continuous" },
  { seconds: 900, label: "Every 15 minutes", detail: "On the quarter hour" },
  { seconds: 3600, label: "Every hour", detail: "Once an hour" },
  { seconds: 21600, label: "Every 6 hours", detail: "Four times a day" },
  { seconds: 86400, label: "Every day", detail: "Once a day" },
];

/** What to do with a successful tick. Empty skips the callback node. */
export type RoutineCallbackKind = "orchestrator";

export const ROUTINE_CALLBACKS: {
  id: RoutineCallbackKind;
  label: string;
  detail: string;
}[] = [
  {
    id: "orchestrator",
    label: "Send to Orchestrator",
    detail: "Hand the result to Studio",
  },
];

export type RoutineNodeType = "gate" | "perform" | "callback" | "persist";

export type RoutineNodeId = "gate" | "perform" | "callback" | "persist";

export type RoutineGraphNode = {
  id: RoutineNodeId;
  type: RoutineNodeType;
  label: string;
};

export type RoutineGraphEdge = {
  source: typeof ROUTINE_GRAPH_START | RoutineNodeId;
  target: RoutineNodeId | typeof ROUTINE_GRAPH_END;
  condition: "always" | "ready" | "blocked" | "done" | "ok" | "error";
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
  lastCallbackOutput: string | null;
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
  /** Named action after a successful tick. Empty skips the node. */
  callback: RoutineCallbackKind | "";
  cadenceSeconds: RoutineCadenceSeconds;
  timezone: string;
  graph: RoutineCompiledGraph;
  state: RoutineGraphState;
  createdAt: string;
  updatedAt: string;
};

export function isRoutineCallback(
  value: string,
): value is RoutineCallbackKind {
  return ROUTINE_CALLBACKS.some((item) => item.id === value);
}

export function callbackLabel(value: string): string {
  return (
    ROUTINE_CALLBACKS.find((item) => item.id === value)?.label ?? value
  );
}

export function normalizeRoutineCallback(
  value?: string | null,
): RoutineCallbackKind | "" {
  const next = value ?? "";
  return isRoutineCallback(next) ? next : "";
}

export function compileRoutineGraph(
  callback?: string | null,
): RoutineCompiledGraph {
  const nodes: RoutineGraphNode[] = [
    { id: "gate", type: "gate", label: "Gate" },
    { id: "perform", type: "perform", label: "Perform" },
  ];
  const edges: RoutineGraphEdge[] = [
    { source: ROUTINE_GRAPH_START, target: "gate", condition: "always" },
    { source: "gate", target: "perform", condition: "ready" },
    { source: "gate", target: "persist", condition: "blocked" },
  ];

  if (isRoutineCallback(callback?.trim() ?? "")) {
    nodes.push({ id: "callback", type: "callback", label: "Callback" });
    edges.push(
      { source: "perform", target: "callback", condition: "ok" },
      { source: "perform", target: "persist", condition: "error" },
      { source: "callback", target: "persist", condition: "always" },
    );
  } else {
    edges.push(
      { source: "perform", target: "persist", condition: "ok" },
      { source: "perform", target: "persist", condition: "error" },
    );
  }

  nodes.push({ id: "persist", type: "persist", label: "Persist" });
  edges.push({
    source: "persist",
    target: ROUTINE_GRAPH_END,
    condition: "always",
  });

  return { entry: "gate", nodes, edges };
}

export function compileCapabilityRoutineGraph(): RoutineCompiledGraph {
  return compileRoutineGraph("");
}

export const CAPABILITY_ROUTINE_GRAPH: RoutineCompiledGraph =
  compileRoutineGraph("");

export function emptyRoutineState(): RoutineGraphState {
  return {
    tick: 0,
    currentNode: null,
    lastStatus: "idle",
    lastOutput: null,
    lastCallbackOutput: null,
    lastError: null,
    lastRunAt: null,
    nextRunAt: null,
  };
}

export function cadenceLabel(seconds: number): string {
  return (
    ROUTINE_CADENCES.find((item) => item.seconds === seconds)?.label ??
    `Every ${seconds} seconds`
  );
}

export function isLiveCadence(seconds: number): boolean {
  return seconds === LIVE_CADENCE_SECONDS;
}

export function computeNextRunAt(
  from: Date,
  cadenceSeconds: RoutineCadenceSeconds,
): string {
  return new Date(from.getTime() + cadenceSeconds * 1000).toISOString();
}

export function isRoutineCadence(
  value: number,
): value is RoutineCadenceSeconds {
  return ROUTINE_CADENCES.some((item) => item.seconds === value);
}

export function cadenceFromLegacyMinutes(
  minutes: number,
): RoutineCadenceSeconds | null {
  const seconds = minutes * 60;
  return isRoutineCadence(seconds) ? seconds : null;
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
