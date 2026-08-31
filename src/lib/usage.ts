import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import type { LanguageModelUsage, ProviderMetadata } from "ai";

const DATA_DIR = path.join(process.cwd(), "data");
const USAGE_FILE = path.join(DATA_DIR, "usage.json");
const MAX_EVENTS = 5000;

export const USAGE_SOURCES = [
  "chat.orchestrator",
  "chat.invoke-agent",
  "skills.generate",
  "skills.test",
  "routine.perform",
] as const;

export type UsageSource = (typeof USAGE_SOURCES)[number];

export type UsageStatus = "ok" | "error";

export type UsageEvent = {
  id: string;
  createdAt: string;
  source: UsageSource;
  action: string;
  status: UsageStatus;
  provider: string;
  model: string;
  finishReason?: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  costUsd?: number;
  durationMs?: number;
  stepNumber?: number;
  stepLabel?: string;
  runId?: string;
  callId?: string;
  agentId?: string;
  toolNames?: string[];
  preview?: string;
  error?: string;
};

export type UsageTotals = {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  costUsd: number;
};

type UsageFile = {
  events: UsageEvent[];
};

let events: UsageEvent[] = [];

function emptyTotals(): UsageTotals {
  return {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    cachedInputTokens: 0,
    cacheWriteTokens: 0,
    reasoningTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };
}

function loadFromDisk() {
  if (!existsSync(USAGE_FILE)) return;
  try {
    const raw = readFileSync(USAGE_FILE, "utf8");
    const parsed = JSON.parse(raw) as UsageFile;
    if (!Array.isArray(parsed?.events)) return;
    events = parsed.events
      .filter((event) => event && typeof event.id === "string")
      .map((event) => withEstimatedCost({
        ...event,
        cacheWriteTokens: event.cacheWriteTokens ?? 0,
      }));
  } catch {
    events = [];
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    USAGE_FILE,
    `${JSON.stringify({ events }, null, 2)}\n`,
    "utf8",
  );
}

function withEstimatedCost(event: UsageEvent): UsageEvent {
  return {
    ...event,
    costUsd: estimateCostUsd(event),
  };
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/** USD per 1M tokens. Cached input is billed separately from uncached input. */
type ModelPrice = {
  input: number;
  cachedInput: number;
  output: number;
  longInput?: number;
  longCachedInput?: number;
  longOutput?: number;
  longContextTokens?: number;
};

const OPENAI_PRICES: Record<string, ModelPrice> = {
  "gpt-5.5": {
    input: 5,
    cachedInput: 0.5,
    output: 30,
    longInput: 10,
    longCachedInput: 1,
    longOutput: 45,
    longContextTokens: 272_000,
  },
  "gpt-5.5-pro": { input: 30, cachedInput: 30, output: 180 },
  "gpt-5.4": { input: 2.5, cachedInput: 0.25, output: 15 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-5.4-nano": { input: 0.2, cachedInput: 0.02, output: 1.25 },
  "gpt-5.4-pro": { input: 30, cachedInput: 30, output: 180 },
};

function priceForModel(model: string): ModelPrice {
  const id = model.replace(/^openai\//i, "").trim().toLowerCase();
  if (OPENAI_PRICES[id]) return OPENAI_PRICES[id];
  const match = Object.keys(OPENAI_PRICES)
    .sort((a, b) => b.length - a.length)
    .find((key) => id === key || id.startsWith(`${key}-`));
  return match ? OPENAI_PRICES[match]! : OPENAI_PRICES["gpt-5.5"]!;
}

export function estimateCostUsd(options: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
}): number {
  const price = priceForModel(options.model);
  const cached = Math.min(
    Math.max(0, options.cachedInputTokens),
    Math.max(0, options.inputTokens),
  );
  const uncached = Math.max(0, options.inputTokens - cached);
  const long =
    price.longContextTokens != null &&
    options.inputTokens > price.longContextTokens;
  const inputRate = long ? (price.longInput ?? price.input) : price.input;
  const cachedRate = long
    ? (price.longCachedInput ?? price.cachedInput)
    : price.cachedInput;
  const outputRate = long ? (price.longOutput ?? price.output) : price.output;
  const usd =
    (uncached * inputRate + cached * cachedRate + options.outputTokens * outputRate) /
    1_000_000;
  return Math.round(usd * 1_000_000) / 1_000_000;
}

function usageFromRaw(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  const inputDetails =
    value.prompt_tokens_details ?? value.input_tokens_details;
  const outputDetails =
    value.completion_tokens_details ?? value.output_tokens_details;
  const details =
    inputDetails && typeof inputDetails === "object"
      ? (inputDetails as Record<string, unknown>)
      : undefined;
  const outDetails =
    outputDetails && typeof outputDetails === "object"
      ? (outputDetails as Record<string, unknown>)
      : undefined;
  const inputTokens = asNumber(value.prompt_tokens ?? value.input_tokens);
  const outputTokens = asNumber(
    value.completion_tokens ?? value.output_tokens,
  );
  const totalTokens =
    asNumber(value.total_tokens) || inputTokens + outputTokens;
  if (inputTokens === 0 && outputTokens === 0 && totalTokens === 0) {
    return null;
  }
  return {
    inputTokens,
    outputTokens,
    cachedInputTokens: asNumber(details?.cached_tokens),
    cacheWriteTokens: asNumber(details?.cache_write_tokens),
    reasoningTokens: asNumber(outDetails?.reasoning_tokens),
    totalTokens,
  };
}

export function usageFromProvider(
  usage: LanguageModelUsage | undefined,
  _providerMetadata?: ProviderMetadata,
) {
  const fromRaw = usageFromRaw(usage?.raw);
  if (fromRaw) return fromRaw;

  const inputTokens = asNumber(usage?.inputTokens);
  const outputTokens = asNumber(usage?.outputTokens);
  const cachedInputTokens = asNumber(usage?.inputTokenDetails?.cacheReadTokens);
  const cacheWriteTokens = asNumber(usage?.inputTokenDetails?.cacheWriteTokens);
  const reasoningTokens = asNumber(usage?.outputTokenDetails?.reasoningTokens);
  const totalTokens =
    asNumber(usage?.totalTokens) || inputTokens + outputTokens;
  return {
    inputTokens,
    outputTokens,
    cachedInputTokens,
    cacheWriteTokens,
    reasoningTokens,
    totalTokens,
  };
}

function truncatePreview(text: string | undefined, max = 280): string | undefined {
  if (!text?.trim()) return undefined;
  const collapsed = text.replace(/\s+/g, " ").trim();
  if (collapsed.length <= max) return collapsed;
  return `${collapsed.slice(0, max)}…`;
}

function stepLabelFromTools(toolNames?: string[]): string {
  const names = toolNames?.filter(Boolean) ?? [];
  if (names.length === 0) return "Model response";
  return names.join(", ");
}

export function recordUsage(
  input: Omit<UsageEvent, "id" | "createdAt"> & {
    id?: string;
    createdAt?: string;
  },
): UsageEvent | null {
  try {
    const event = withEstimatedCost({
      ...input,
      id: input.id ?? crypto.randomUUID(),
      createdAt: input.createdAt ?? new Date().toISOString(),
      preview: truncatePreview(input.preview),
      toolNames: input.toolNames?.filter(Boolean).slice(0, 12),
    });
    events = [event, ...events].slice(0, MAX_EVENTS);
    saveToDisk();
    return event;
  } catch (error) {
    console.error("usage log failed", error);
    return null;
  }
}

export function recordUsageFromGenerate(options: {
  source: UsageSource;
  action: string;
  status?: UsageStatus;
  provider: string;
  model: string;
  agentId?: string;
  durationMs?: number;
  error?: string;
  result: {
    usage?: LanguageModelUsage;
    providerMetadata?: ProviderMetadata;
    finishReason?: string;
    text?: string;
    steps?: Array<{
      stepNumber?: number;
      usage?: LanguageModelUsage;
      providerMetadata?: ProviderMetadata;
      finishReason?: string;
      text?: string;
      toolCalls?: Array<{ toolName?: string }>;
      performance?: { stepTimeMs?: number };
      model?: { provider?: string; modelId?: string };
    }>;
  };
}): UsageEvent | null {
  const runId = crypto.randomUUID();
  const steps = options.result.steps?.filter((step) => step.usage) ?? [];
  if (steps.length === 0) {
    const tokens = usageFromProvider(
      options.result.usage,
      options.result.providerMetadata,
    );
    return recordUsage({
      source: options.source,
      action: options.action,
      stepLabel: "Model response",
      runId,
      status: options.status ?? "ok",
      provider: options.provider,
      model: options.model,
      finishReason: options.result.finishReason,
      ...tokens,
      durationMs: options.durationMs,
      agentId: options.agentId,
      preview: options.result.text,
      error: options.error,
    });
  }

  let last: UsageEvent | null = null;
  for (const [index, step] of steps.entries()) {
    const tokens = usageFromProvider(step.usage, step.providerMetadata);
    const toolNames = step.toolCalls
      ?.map((call) => call.toolName)
      .filter((name): name is string => Boolean(name));
    last = recordUsage({
      source: options.source,
      action: options.action,
      stepLabel: stepLabelFromTools(toolNames),
      runId,
      status: options.status ?? "ok",
      provider: step.model?.provider ?? options.provider,
      model: step.model?.modelId
        ? step.model.modelId.includes("/")
          ? step.model.modelId
          : `${options.provider}/${step.model.modelId}`
        : options.model,
      finishReason: step.finishReason ?? options.result.finishReason,
      ...tokens,
      durationMs: step.performance?.stepTimeMs ?? options.durationMs,
      stepNumber: step.stepNumber ?? index,
      agentId: options.agentId,
      toolNames,
      preview: step.text || options.result.text,
      error: options.error,
    });
  }
  return last;
}

export function recordUsageFromStep(options: {
  source: UsageSource;
  action: string;
  status?: UsageStatus;
  agentId?: string;
  runId?: string;
  error?: string;
  step: {
    callId?: string;
    stepNumber?: number;
    model?: { provider?: string; modelId?: string };
    usage?: LanguageModelUsage;
    providerMetadata?: ProviderMetadata;
    finishReason?: string;
    text?: string;
    toolCalls?: Array<{ toolName?: string }>;
    performance?: { stepTimeMs?: number };
  };
}): UsageEvent | null {
  const tokens = usageFromProvider(
    options.step.usage,
    options.step.providerMetadata,
  );
  const toolNames = options.step.toolCalls
    ?.map((call) => call.toolName)
    .filter((name): name is string => Boolean(name));

  return recordUsage({
    source: options.source,
    action: options.action,
    stepLabel: stepLabelFromTools(toolNames),
    runId: options.runId ?? options.step.callId,
    status: options.status ?? "ok",
    provider: options.step.model?.provider ?? "openai",
    model: options.step.model?.modelId ?? "unknown",
    finishReason: options.step.finishReason,
    ...tokens,
    durationMs: options.step.performance?.stepTimeMs,
    stepNumber: options.step.stepNumber,
    callId: options.step.callId,
    agentId: options.agentId,
    toolNames,
    preview: options.step.text,
    error: options.error,
  });
}

export function listUsageEvents(limit = 500): UsageEvent[] {
  return events.slice(0, limit);
}

export function eventBelongsToAgent(
  event: UsageEvent,
  agentId: string,
): boolean {
  if (event.agentId === agentId) return true;
  const action = event.action.toLowerCase();
  const id = agentId.toLowerCase();
  return action.includes(id);
}

export function listUsageEventsForAgent(
  agentId: string,
  limit = 200,
): UsageEvent[] {
  return events
    .filter((event) => eventBelongsToAgent(event, agentId))
    .slice(0, limit);
}

export function clearUsageEvents(): void {
  events = [];
  saveToDisk();
}

export function summarizeUsage(items: UsageEvent[]): UsageTotals {
  return items.reduce<UsageTotals>((totals, event) => {
    totals.requests += 1;
    totals.inputTokens += event.inputTokens;
    totals.outputTokens += event.outputTokens;
    totals.cachedInputTokens += event.cachedInputTokens;
    totals.cacheWriteTokens += event.cacheWriteTokens;
    totals.reasoningTokens += event.reasoningTokens;
    totals.totalTokens += event.totalTokens;
    totals.costUsd += event.costUsd ?? estimateCostUsd(event);
    return totals;
  }, emptyTotals());
}

function startOfTodayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export function usageDashboard(limit = 500, agentId?: string) {
  const all = agentId
    ? listUsageEventsForAgent(agentId, limit)
    : listUsageEvents(limit);
  const todayStart = startOfTodayIso();
  const today = all.filter((event) => event.createdAt >= todayStart);
  return {
    events: all,
    totals: {
      all: summarizeUsage(all),
      today: summarizeUsage(today),
    },
  };
}

loadFromDisk();
