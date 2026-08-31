"use client";

import { HistoryIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalTime } from "@/components/local-time";
import type { UsageEvent, UsageSource } from "@/lib/usage";
import {
  groupUsageEvents,
  runHasError,
  usageRunTitle,
  usageStepLabel,
} from "@/lib/usage-groups";

const SOURCE_LABEL: Record<UsageSource, string> = {
  "chat.orchestrator": "Studio chat",
  "chat.invoke-agent": "Studio",
  "skills.generate": "Write capability",
  "skills.test": "Try capability",
  "routine.perform": "Routine",
};

type UsageResponse = {
  events?: UsageEvent[];
};

export function AgentActions({ agentId }: { agentId: string }) {
  const [events, setEvents] = useState<UsageEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    setError(null);

    async function load() {
      try {
        const response = await fetch(
          `/api/usage?agentId=${encodeURIComponent(agentId)}`,
        );
        const payload = (await response.json()) as UsageResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error || "Failed to load actions");
        }
        if (!cancelled) setEvents(payload.events ?? []);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load actions",
          );
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [agentId]);

  const runs = useMemo(
    () => (events ? groupUsageEvents(events) : []),
    [events],
  );

  if (error) {
    return (
      <p className="text-sm text-destructive">{error}</p>
    );
  }

  if (!events) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (runs.length === 0) {
    return (
      <Empty className="min-h-[28vh] ring-1 ring-foreground/10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HistoryIcon />
          </EmptyMedia>
          <EmptyTitle>No actions yet</EmptyTitle>
          <EmptyDescription>
            When this agent works from Studio or a routine, those runs show up
            here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className="flex flex-col">
      {runs.map((run) => {
        const head = run.events[0];
        if (!head) return null;
        const failed = runHasError(run);
        const preview =
          run.events.find((event) => event.preview?.trim())?.preview ??
          run.events.find((event) => event.error?.trim())?.error ??
          null;
        return (
          <li
            key={run.id}
            className="flex flex-col gap-2 border-t border-border py-4 first:border-t-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-sm font-medium">
                  {usageRunTitle(head).replace(/^Invoke\s+/i, "Asked ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {SOURCE_LABEL[head.source]} · {usageStepLabel(head)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={failed ? "destructive" : "outline"}>
                  {failed ? "Error" : "OK"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <LocalTime value={head.createdAt} />
                </span>
              </div>
            </div>
            {preview ? (
              <p className="line-clamp-3 font-mono text-xs text-muted-foreground">
                {preview}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
