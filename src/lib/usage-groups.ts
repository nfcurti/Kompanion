import type { UsageEvent, UsageTotals } from "@/lib/usage";

export type UsageRun = {
  id: string;
  events: UsageEvent[];
};

const LEGACY_STEP_SUFFIX = /\s·\s(?:request|step)\s+\d+$/i;

export function usageRunTitle(event: UsageEvent): string {
  return event.action.replace(LEGACY_STEP_SUFFIX, "").trim() || event.action;
}

export function usageStepLabel(event: UsageEvent): string {
  if (event.stepLabel?.trim()) return event.stepLabel;
  if (event.toolNames && event.toolNames.length > 0) {
    return event.toolNames.join(", ");
  }
  return "Model response";
}

function isLegacyMultiRequest(event: UsageEvent): boolean {
  return event.stepNumber != null || LEGACY_STEP_SUFFIX.test(event.action);
}

function belongsToRun(run: UsageRun, event: UsageEvent): boolean {
  const head = run.events[0];
  if (!head) return false;
  if (head.runId || event.runId) {
    return Boolean(head.runId && event.runId && head.runId === event.runId);
  }
  if (!isLegacyMultiRequest(head) && !isLegacyMultiRequest(event)) {
    return false;
  }
  const started = Date.parse(head.createdAt);
  const next = Date.parse(event.createdAt);
  if (!Number.isFinite(started) || !Number.isFinite(next)) return false;
  return (
    head.source === event.source &&
    usageRunTitle(head) === usageRunTitle(event) &&
    Math.abs(started - next) < 120_000
  );
}

export function groupUsageEvents(events: UsageEvent[]): UsageRun[] {
  const runs: UsageRun[] = [];
  const runById = new Map<string, UsageRun>();

  for (const event of events) {
    if (event.runId) {
      const existing = runById.get(event.runId);
      if (existing) {
        existing.events.push(event);
        continue;
      }
      const run: UsageRun = { id: event.runId, events: [event] };
      runById.set(event.runId, run);
      runs.push(run);
      continue;
    }

    const last = runs.at(-1);
    if (last && belongsToRun(last, event)) {
      last.events.push(event);
      continue;
    }
    runs.push({
      id: event.id,
      events: [event],
    });
  }
  return runs;
}

export function orderedRunRequests(run: UsageRun): UsageEvent[] {
  return [...run.events].sort((left, right) => {
    const leftStep = left.stepNumber ?? 0;
    const rightStep = right.stepNumber ?? 0;
    if (leftStep !== rightStep) return leftStep - rightStep;
    return Date.parse(left.createdAt) - Date.parse(right.createdAt);
  });
}

export function summarizeRun(run: UsageRun): UsageTotals {
  return run.events.reduce<UsageTotals>(
    (totals, event) => {
      totals.requests += 1;
      totals.inputTokens += event.inputTokens;
      totals.outputTokens += event.outputTokens;
      totals.cachedInputTokens += event.cachedInputTokens;
      totals.cacheWriteTokens += event.cacheWriteTokens;
      totals.reasoningTokens += event.reasoningTokens;
      totals.totalTokens += event.totalTokens;
      totals.costUsd += event.costUsd ?? 0;
      return totals;
    },
    {
      requests: 0,
      inputTokens: 0,
      outputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    },
  );
}

export function runDurationMs(run: UsageRun): number | undefined {
  const values = run.events
    .map((event) => event.durationMs)
    .filter((value): value is number => value != null);
  if (values.length === 0) return undefined;
  return values.reduce((sum, value) => sum + value, 0);
}

export function runHasError(run: UsageRun): boolean {
  return run.events.some((event) => event.status === "error");
}

export function runModel(run: UsageRun): string {
  const models = [...new Set(run.events.map((event) => event.model))];
  if (models.length === 1) return models[0] ?? "Unknown";
  return models.length > 1 ? "Multiple" : "Unknown";
}
