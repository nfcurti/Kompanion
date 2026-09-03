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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalTime } from "@/components/local-time";
import type { UsageEvent, UsageSource } from "@/lib/usage";
import {
  groupUsageEvents,
  runHasError,
  usageRunTitle,
  usageStepLabel,
} from "@/lib/usage-groups";

const PAGE_SIZE = 10;

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

function pageWindow(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  const items: Array<number | "gap"> = [1];
  if (start > 2) items.push("gap");
  for (let n = start; n <= end; n += 1) items.push(n);
  if (end < pageCount - 1) items.push("gap");
  items.push(pageCount);
  return items;
}

export function AgentActions({ agentId }: { agentId: string }) {
  const [events, setEvents] = useState<UsageEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setEvents(null);
    setError(null);
    setPage(1);

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

  const pageCount = Math.max(1, Math.ceil(runs.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRuns = runs.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const from = runs.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, runs.length);

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
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col">
        {pagedRuns.map((run) => {
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

      {pageCount > 1 ? (
        <div className="flex flex-col items-center gap-3 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground">
            {from}–{to} of {runs.length}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={currentPage <= 1}
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                />
              </PaginationItem>
              {pageWindow(currentPage, pageCount).map((item, index) =>
                item === "gap" ? (
                  <PaginationItem key={`gap-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={item === currentPage}
                      onClick={() => setPage(item)}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  disabled={currentPage >= pageCount}
                  onClick={() =>
                    setPage((value) => Math.min(pageCount, value + 1))
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      ) : null}
    </div>
  );
}
