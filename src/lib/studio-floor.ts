import { getAgent } from "@/agents/registry";
import { listRoutines } from "@/lib/routines-registry";
import type { StudioInboxItem } from "@/lib/studio-inbox";
import { listUsageEvents } from "@/lib/usage";

function sortByTime(items: StudioInboxItem[]): StudioInboxItem[] {
  return [...items].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Snapshot of workspace work for Studio when the thread is empty.
 */
export function listStudioFloor(): StudioInboxItem[] {
  const fromRoutines: StudioInboxItem[] = listRoutines()
    .filter(
      (routine) =>
        Boolean(routine.state.lastOutput?.trim()) ||
        Boolean(routine.state.lastError?.trim()),
    )
    .map((routine) => {
      const agent = getAgent(routine.agentId);
      return {
        id: `routine-${routine.id}-${routine.state.lastRunAt ?? routine.id}`,
        kind: "routine",
        title: routine.name,
        agentId: routine.agentId,
        agentName: agent?.name ?? routine.agentId,
        output:
          routine.state.lastOutput?.trim() ||
          routine.state.lastError?.trim() ||
          "Done",
        createdAt: routine.state.lastRunAt ?? routine.updatedAt,
      };
    });

  const fromUsage: StudioInboxItem[] = listUsageEvents(120)
    .filter(
      (event) =>
        (event.source === "skills.test" || event.source === "chat.invoke-agent") &&
        Boolean(event.preview?.trim() || event.error?.trim()),
    )
    .map((event) => ({
      id: `usage-${event.id}`,
      kind: event.source === "skills.test" ? "capability" : "agent",
      title: event.action,
      agentId: event.agentId,
      agentName: event.agentId
        ? (getAgent(event.agentId)?.name ?? event.agentId)
        : undefined,
      output: event.preview?.trim() || event.error?.trim() || "Done",
      createdAt: event.createdAt,
    }));

  return sortByTime([...fromRoutines, ...fromUsage]).slice(-40);
}
