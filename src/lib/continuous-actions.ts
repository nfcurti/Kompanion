export type ContinuousActionStatus =
  | "draft"
  | "armed"
  | "paused"
  | "disabled";

export type ContinuousAction = {
  id: string;
  name: string;
  description: string;
  status: ContinuousActionStatus;
  trigger: string;
  agents: string[];
  schedule: string;
  lastRun: string | null;
};

/** Empty until continuous actions are persisted. */
export function listContinuousActions(): ContinuousAction[] {
  return [];
}
