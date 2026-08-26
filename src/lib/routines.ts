export type RoutineStatus = "draft" | "active" | "paused" | "disabled";

export type RoutineTrigger = "schedule" | "webhook";

/**
 * Standing work: same agent + capabilities as Studio, without a chat session.
 */
export type Routine = {
  id: string;
  name: string;
  description: string;
  status: RoutineStatus;
  agentId: string | null;
  prompt: string;
  trigger: RoutineTrigger;
  cron: string | null;
  lastRunAt: string | null;
};

/** Empty until routines are persisted. */
export function listRoutines(): Routine[] {
  return [];
}
