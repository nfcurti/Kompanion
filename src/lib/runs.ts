export type RunStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";

export type RunRecord = {
  id: string;
  title: string;
  source: "playground" | "continuous-action";
  status: RunStatus;
  model: string;
  agents: string[];
  startedAt: string;
  durationMs: number | null;
  toolCalls: number;
};

/** Empty until run persistence is wired. */
export function listRuns(): RunRecord[] {
  return [];
}
