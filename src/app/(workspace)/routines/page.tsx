"use client";

import { RepeatIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { statusMeta } from "@/components/agents/agent-meta";
import { CreateRoutineSheet } from "@/components/routines/create-routine-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalTime } from "@/components/local-time";
import { PageHeader } from "@/components/workspace/page-header";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import {
  callbackLabel,
  cadenceLabel,
  isLiveCadence,
  type Routine,
  type RoutineStatus,
} from "@/lib/routines";
import { cn } from "@/lib/utils";

const statusLabel: Record<RoutineStatus, string> = {
  active: "Active",
  paused: "Paused",
  draft: "Draft",
};

const tickLabel: Record<Routine["state"]["lastStatus"], string> = {
  idle: "Idle",
  running: "Running",
  ok: "Last tick ok",
  error: "Last tick failed",
};

function GraphStepper({ routine }: { routine: Routine }) {
  const current = routine.state.currentNode;
  const running = routine.state.lastStatus === "running";

  return (
    <ol className="flex flex-wrap items-center gap-1.5 text-xs">
      {routine.graph.nodes.map((node, index) => {
        const active = current === node.id;
        return (
          <li key={node.id} className="flex items-center gap-1.5">
            {index > 0 ? (
              <span className="text-muted-foreground" aria-hidden>
                →
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-md px-1.5 py-0.5 ring-1 ring-foreground/10",
                active && running
                  ? "bg-foreground text-background"
                  : active && current === "persist"
                    ? "bg-muted"
                    : "bg-muted/60 text-muted-foreground",
              )}
            >
              {node.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export default function RoutinesPage() {
  const { agents, skills } = useWorkspace();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/routines");
    const payload = (await response.json()) as { routines?: Routine[] };
    setRoutines(payload.routines ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useEffect(() => {
    const running = routines.some(
      (routine) => routine.state.lastStatus === "running",
    );
    if (!running) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 4000);
    return () => window.clearInterval(timer);
  }, [routines, refresh]);

  function upsert(next: Routine) {
    setRoutines((current) =>
      [next, ...current.filter((item) => item.id !== next.id)].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    );
  }

  async function patchStatus(routine: Routine, status: RoutineStatus) {
    setBusyId(routine.id);
    try {
      const response = await fetch(`/api/routines/${routine.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as {
        routine?: Routine;
        error?: string;
      };
      if (!response.ok || !payload.routine) {
        throw new Error(payload.error || "Failed to update routine");
      }
      upsert(payload.routine);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update routine",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function runNow(routine: Routine) {
    setBusyId(routine.id);
    try {
      const response = await fetch(`/api/routines/${routine.id}/run`, {
        method: "POST",
      });
      const payload = (await response.json()) as {
        routine?: Routine;
        error?: string;
      };
      if (!response.ok || !payload.routine) {
        throw new Error(payload.error || "Failed to run routine");
      }
      upsert(payload.routine);
      if (payload.routine.state.lastStatus === "error") {
        toast.error(payload.routine.state.lastError || "Tick failed");
      } else {
        toast.success("Tick finished");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to run routine",
      );
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function remove(routine: Routine) {
    setBusyId(routine.id);
    try {
      const response = await fetch(`/api/routines/${routine.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || "Failed to delete routine");
      }
      setRoutines((current) => current.filter((item) => item.id !== routine.id));
      toast.success("Routine deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete routine",
      );
    } finally {
      setBusyId(null);
    }
  }

  function agentLabel(agentId: string) {
    const agent = agents.find((item) => item.id === agentId);
    return agent?.name || agentId;
  }

  function capabilityLabels(agentId: string) {
    const agent = agents.find((item) => item.id === agentId);
    const ids = agent?.capabilities ?? [];
    if (ids.length === 0) return "No capabilities";
    return ids
      .map((id) => skills.find((skill) => skill.id === id)?.name || id)
      .join(", ");
  }

  function agentStatus(agentId: string) {
    return agents.find((item) => item.id === agentId)?.status;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <PageHeader
          title="Routines"
          description="Repeating tasks owned by an agent. Each tick gates that they are Active, they use their capabilities, and the result lands in Studio."
        >
          <CreateRoutineSheet
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={upsert}
          />
        </PageHeader>

        {loading ? (
          <div className="flex flex-col gap-2">
            <Skeleton className="h-36 w-full" />
            <Skeleton className="h-36 w-full" />
          </div>
        ) : null}

        {!loading && routines.length === 0 ? (
          <Empty className="min-h-[40vh] ring-1 ring-foreground/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RepeatIcon />
              </EmptyMedia>
              <EmptyTitle>No routines yet</EmptyTitle>
              <EmptyDescription>
                Pick an agent and a schedule. They use their capabilities.
                Each tick reports to Studio.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setCreateOpen(true)}>New routine</Button>
                <Button asChild variant="outline">
                  <Link href="/agents">Open agents</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/capabilities">Open capabilities</Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        ) : null}

        {routines.length > 0 ? (
          <div className="flex flex-col gap-2">
            {routines.map((routine) => {
              const ownerStatus = agentStatus(routine.agentId);
              const ownerMeta = ownerStatus ? statusMeta[ownerStatus] : null;
              const busy = busyId === routine.id;
              const running = routine.state.lastStatus === "running";
              return (
                <article
                  key={routine.id}
                  className="flex flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-sm font-medium">{routine.name}</h2>
                        <Badge variant="secondary">
                          {statusLabel[routine.status]}
                        </Badge>
                        {isLiveCadence(routine.cadenceSeconds) ? (
                          <Badge>Live</Badge>
                        ) : null}
                        <Badge
                          variant={
                            routine.state.lastStatus === "error"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {tickLabel[routine.state.lastStatus]}
                        </Badge>
                      </div>
                      {routine.description ? (
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {routine.description}
                        </p>
                      ) : null}
                      <p className="text-sm text-muted-foreground">
                        <span className="font-mono text-foreground">
                          {agentLabel(routine.agentId)}
                        </span>
                        {ownerMeta ? (
                          <span className="text-muted-foreground">
                            {" "}
                            · {ownerMeta.label}
                          </span>
                        ) : null}
                        {" · "}
                        {capabilityLabels(routine.agentId)}
                        {" · "}
                        {cadenceLabel(routine.cadenceSeconds)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy || running}
                        onClick={() => void runNow(routine)}
                      >
                        {running ? "Running…" : "Run now"}
                      </Button>
                      {routine.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void patchStatus(routine, "paused")}
                        >
                          Pause
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => void patchStatus(routine, "active")}
                        >
                          Resume
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={busy}
                        onClick={() => void remove(routine)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <GraphStepper routine={routine} />

                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {routine.prompt}
                  </p>
                  {routine.callback ? (
                    <p className="text-sm text-muted-foreground">
                      Callback: {callbackLabel(routine.callback)}
                    </p>
                  ) : null}

                  <dl className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                    <div>
                      <dt>Last run</dt>
                      <dd className="text-foreground">
                        <LocalTime
                          value={routine.state.lastRunAt}
                          fallback="Not scheduled"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt>Next run</dt>
                      <dd className="text-foreground">
                        {routine.status === "active"
                          ? (
                            <LocalTime
                              value={routine.state.nextRunAt}
                              fallback="Not scheduled"
                            />
                          )
                          : "Paused"}
                      </dd>
                    </div>
                    <div>
                      <dt>Ticks</dt>
                      <dd className="text-foreground">{routine.state.tick}</dd>
                    </div>
                  </dl>

                  {routine.state.lastError ? (
                    <p className="text-sm text-destructive">
                      {routine.state.lastError}
                    </p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
