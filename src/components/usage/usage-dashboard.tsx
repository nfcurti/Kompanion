"use client";

import { ChevronDownIcon, CircleDollarSignIcon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LocalTime } from "@/components/local-time";
import { cn } from "@/lib/utils";
import type {
  UsageEvent,
  UsageSource,
  UsageTotals,
} from "@/lib/usage";
import {
  groupUsageEvents,
  orderedRunRequests,
  runDurationMs,
  runHasError,
  runModel,
  summarizeRun,
  usageRunTitle,
  usageStepLabel,
  type UsageRun,
} from "@/lib/usage-groups";

type UsageResponse = {
  events: UsageEvent[];
  totals: {
    all: UsageTotals;
    today: UsageTotals;
  };
};

const SOURCE_FILTERS: { value: "all" | UsageSource; label: string }[] = [
  { value: "all", label: "All actions" },
  { value: "chat.orchestrator", label: "Studio chat" },
  { value: "chat.invoke-agent", label: "Agent work" },
  { value: "skills.generate", label: "Write capability" },
  { value: "skills.test", label: "Try capability" },
  { value: "routine.perform", label: "Routine" },
];

const SOURCE_LABEL: Record<UsageSource, string> = {
  "chat.orchestrator": "Studio chat",
  "chat.invoke-agent": "Agent work",
  "skills.generate": "Write capability",
  "skills.test": "Try capability",
  "routine.perform": "Routine",
};

function formatTokens(value: number) {
  return value.toLocaleString();
}

function formatUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "$0.00";
  if (value < 0.01) return `$${value.toFixed(6)}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatDuration(ms: number | undefined) {
  if (ms == null) return "n/a";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function uncachedInputTokens(event: UsageEvent) {
  return Math.max(0, event.inputTokens - event.cachedInputTokens);
}

function TokenHoverCell({
  total,
  lines,
}: {
  total: number;
  lines: { label: string; value: number }[];
}) {
  return (
    <TableCell className="text-right font-mono tabular-nums">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="hover:cursor-pointer rounded-sm underline decoration-dotted decoration-muted-foreground/70 underline-offset-4"
            onClick={(event) => event.stopPropagation()}
          >
            {formatTokens(total)}
          </button>
        </TooltipTrigger>
        <TooltipContent className="flex flex-col items-start gap-1">
          {lines.map((line) => (
            <span key={line.label}>
              {line.label}: {formatTokens(line.value)}
            </span>
          ))}
        </TooltipContent>
      </Tooltip>
    </TableCell>
  );
}

function UsageRunRows({
  run,
  compact,
  selectedId,
  onSelect,
}: {
  run: UsageRun;
  compact: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const head = run.events[0];
  if (!head) return null;
  const totals = summarizeRun(run);
  const requests = orderedRunRequests(run);
  const errored = runHasError(run);
  const title = usageRunTitle(head);
  const duration = runDurationMs(run);

  return (
    <>
      <TableRow
        className="hover:cursor-pointer"
        onClick={() => setOpen((value) => !value)}
      >
        <TableCell className="text-muted-foreground">
          <LocalTime value={head.createdAt} withSeconds />
        </TableCell>
        <TableCell>
          <div className="flex items-start gap-2">
            <ChevronDownIcon
              className={cn(
                "mt-0.5 size-3.5 shrink-0 text-muted-foreground transition-transform",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate">{title}</span>
              <span className="text-xs text-muted-foreground">
                {SOURCE_LABEL[head.source]}
                {` · ${totals.requests} request${totals.requests === 1 ? "" : "s"}`}
                {duration != null ? ` · ${formatDuration(duration)}` : ""}
              </span>
            </div>
          </div>
        </TableCell>
        {!compact ? (
          <TableCell className="font-mono text-xs">{runModel(run)}</TableCell>
        ) : null}
        <TokenHoverCell
          total={totals.inputTokens}
          lines={[
            {
              label: "Uncached",
              value: Math.max(0, totals.inputTokens - totals.cachedInputTokens),
            },
            { label: "Cached", value: totals.cachedInputTokens },
            ...(totals.cacheWriteTokens
              ? [{ label: "Cache write", value: totals.cacheWriteTokens }]
              : []),
          ]}
        />
        <TokenHoverCell
          total={totals.outputTokens}
          lines={[
            {
              label: "Uncached",
              value: Math.max(0, totals.outputTokens - totals.reasoningTokens),
            },
            { label: "Reasoning", value: totals.reasoningTokens },
          ]}
        />
        <TableCell className="text-right font-mono tabular-nums">
          {formatTokens(totals.totalTokens)}
        </TableCell>
        <TableCell className="text-right font-mono tabular-nums">
          {totals.costUsd <= 0 ? "n/a" : formatUsd(totals.costUsd)}
        </TableCell>
        <TableCell>
          <Badge variant={errored ? "destructive" : "outline"}>
            {errored ? "Error" : "OK"}
          </Badge>
        </TableCell>
      </TableRow>
      {open
        ? requests.map((event) => (
            <TableRow
              key={event.id}
              className="hover:cursor-pointer bg-muted/50"
              data-state={selectedId === event.id ? "selected" : undefined}
              onClick={(click) => {
                click.stopPropagation();
                onSelect(event.id);
              }}
            >
              <TableCell className="text-muted-foreground">
                <LocalTime value={event.createdAt} withSeconds />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 pl-6">
                  <span>{usageStepLabel(event)}</span>
                  <span className="text-xs text-muted-foreground">
                    {event.durationMs != null
                      ? formatDuration(event.durationMs)
                      : "Per request"}
                  </span>
                </div>
              </TableCell>
              {!compact ? (
                <TableCell className="font-mono text-xs">{event.model}</TableCell>
              ) : null}
              <TokenHoverCell
                total={event.inputTokens}
                lines={[
                  {
                    label: "Uncached",
                    value: uncachedInputTokens(event),
                  },
                  {
                    label: "Cached",
                    value: event.cachedInputTokens,
                  },
                  ...(event.cacheWriteTokens
                    ? [
                        {
                          label: "Cache write",
                          value: event.cacheWriteTokens,
                        },
                      ]
                    : []),
                ]}
              />
              <TokenHoverCell
                total={event.outputTokens}
                lines={[
                  {
                    label: "Uncached",
                    value: Math.max(
                      0,
                      event.outputTokens - event.reasoningTokens,
                    ),
                  },
                  {
                    label: "Reasoning",
                    value: event.reasoningTokens,
                  },
                ]}
              />
              <TableCell className="text-right font-mono tabular-nums">
                {formatTokens(event.totalTokens)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">
                {event.costUsd == null ? "n/a" : formatUsd(event.costUsd)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    event.status === "error" ? "destructive" : "outline"
                  }
                >
                  {event.status === "error" ? "Error" : "OK"}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        : null}
    </>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono text-xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint ? (
        <CardContent>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function UsageDashboard({ compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<"all" | UsageSource>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    const response = await fetch("/api/usage");
    if (!response.ok) {
      throw new Error("Failed to load usage");
    }
    const json = (await response.json()) as UsageResponse;
    setData(json);
    setError(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().catch((err: unknown) => {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : "Failed to load usage");
      }
    });
    const timer = window.setInterval(() => {
      load().catch(() => undefined);
    }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [load]);

  const events = useMemo(() => {
    const list = data?.events ?? [];
    if (source === "all") return list;
    return list.filter((event) => event.source === source);
  }, [data?.events, source]);

  const runs = useMemo(() => groupUsageEvents(events), [events]);

  const selected = events.find((event) => event.id === selectedId) ?? null;
  const totals = data?.totals;

  async function onClear() {
    if (
      !window.confirm(
        "Clear all local usage logs? This does not affect OpenAI billing.",
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      const response = await fetch("/api/usage", { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to clear");
      setData((await response.json()) as UsageResponse);
      setSelectedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear");
    } finally {
      setClearing(false);
    }
  }

  if (!data && !error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Empty className="ring-1 ring-foreground/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CircleDollarSignIcon />
          </EmptyMedia>
          <EmptyTitle>Could not load usage</EmptyTitle>
          <EmptyDescription>{error}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Requests today"
          value={formatTokens(totals?.today.requests ?? 0)}
          hint={`${formatTokens(totals?.all.requests ?? 0)} all time`}
        />
        <StatCard
          label="Input tokens"
          value={formatTokens(totals?.today.inputTokens ?? 0)}
          hint={`${formatTokens(totals?.all.inputTokens ?? 0)} all time`}
        />
        <StatCard
          label="Cached input"
          value={formatTokens(totals?.today.cachedInputTokens ?? 0)}
          hint={`${formatTokens(totals?.all.cachedInputTokens ?? 0)} read · ${formatTokens(totals?.all.cacheWriteTokens ?? 0)} written`}
        />
        <StatCard
          label="Output tokens"
          value={formatTokens(totals?.today.outputTokens ?? 0)}
          hint={
            (totals?.today.reasoningTokens ?? 0) > 0
              ? `${formatTokens(totals?.today.reasoningTokens ?? 0)} reasoning today`
              : `${formatTokens(totals?.all.outputTokens ?? 0)} all time`
          }
        />
        <StatCard
          label="Est. cost today"
          value={formatUsd(totals?.today.costUsd ?? 0)}
          hint={`${formatUsd(totals?.all.costUsd ?? 0)} all time · list-price estimate`}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle>Request log</CardTitle>
              <CardDescription>
                Each Studio, agent, or capability run is one row. Expand it to
                see cost per request.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={source}
                onValueChange={(value) =>
                  setSource(value as "all" | UsageSource)
                }
              >
                <SelectTrigger size="sm" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    {SOURCE_FILTERS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                disabled={clearing || (data?.events.length ?? 0) === 0}
                onClick={() => void onClear()}
              >
                Clear log
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {events.length === 0 ? (
            <Empty className="py-12">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CircleDollarSignIcon />
                </EmptyMedia>
                <EmptyTitle>No token usage yet</EmptyTitle>
                <EmptyDescription>
                  Send a Studio message or try a capability. Each request from
                  the model shows up here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  {!compact ? <TableHead>Model</TableHead> : null}
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <UsageRunRows
                    key={run.id}
                    run={run}
                    compact={compact}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                  />
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={selected != null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="flex flex-col gap-0 sm:max-w-lg">
          {selected ? (
            <>
              <SheetHeader>
                <SheetTitle>
                  {usageStepLabel(selected)}
                </SheetTitle>
                <SheetDescription>
                  {usageRunTitle(selected)} · {SOURCE_LABEL[selected.source]} ·{" "}
                  <LocalTime value={selected.createdAt} withSeconds />
                </SheetDescription>
              </SheetHeader>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{selected.provider}</Badge>
                  <Badge variant="outline" className="font-mono">
                    {selected.model}
                  </Badge>
                  {selected.finishReason ? (
                    <Badge variant="secondary">{selected.finishReason}</Badge>
                  ) : null}
                  {selected.agentId ? (
                    <Badge variant="secondary">{selected.agentId}</Badge>
                  ) : null}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Input</dt>
                    <dd className="font-mono tabular-nums">
                      {formatTokens(selected.inputTokens)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Cached input</dt>
                    <dd className="font-mono tabular-nums">
                      {formatTokens(selected.cachedInputTokens)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Cache write</dt>
                    <dd className="font-mono tabular-nums">
                      {formatTokens(selected.cacheWriteTokens ?? 0)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Output</dt>
                    <dd className="font-mono tabular-nums">
                      {formatTokens(selected.outputTokens)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Reasoning</dt>
                    <dd className="font-mono tabular-nums">
                      {formatTokens(selected.reasoningTokens)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Total</dt>
                    <dd className="font-mono tabular-nums">
                      {formatTokens(selected.totalTokens)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Cost</dt>
                    <dd className="font-mono tabular-nums">
                      {selected.costUsd == null
                        ? "n/a"
                        : formatUsd(selected.costUsd)}
                    </dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Latency</dt>
                    <dd>{formatDuration(selected.durationMs)}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-muted-foreground">Call</dt>
                    <dd className="truncate font-mono text-xs">
                      {selected.callId ?? "n/a"}
                    </dd>
                  </div>
                </dl>
                {selected.toolNames && selected.toolNames.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Steps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selected.toolNames.map((name) => (
                        <Badge key={name} variant="outline">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {selected.error ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Error</p>
                    <p className="text-sm text-destructive">{selected.error}</p>
                  </div>
                ) : null}
                {selected.preview ? (
                  <div className="flex flex-col gap-1">
                    <p className="text-sm text-muted-foreground">Output preview</p>
                    <p className="rounded-lg bg-muted p-3 text-sm leading-relaxed">
                      {selected.preview}
                    </p>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
