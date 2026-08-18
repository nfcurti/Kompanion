export type AutomationStatus = "draft" | "armed" | "paused" | "disabled";

export type Automation = {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  trigger: string;
  agents: string[];
  schedule: string;
  lastRun: string | null;
};

/** Empty until automations are persisted / registered. */
export function listAutomations(): Automation[] {
  return [];
}
