"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BotIcon, CircleAlertIcon } from "lucide-react";

import { CreateAgentSheet } from "@/components/agents/create-agent-sheet";
import { agentIcon, statusMeta } from "@/components/agents/agent-meta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspace } from "@/components/workspace/workspace-provider";

function AgentsPageContent() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const {
    agents,
    setAgents,
    selectedAgentId,
    setSelectedAgentId,
  } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (focus) setSelectedAgentId(focus);
  }, [focus, setSelectedAgentId]);

  const selected =
    agents.find((agent) => agent.id === (selectedAgentId ?? focus)) ??
    agents[0] ??
    null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="text-sm text-muted-foreground">
              Register specialist agents the orchestrator can call when they
              are active.
            </p>
          </div>
          <CreateAgentSheet
            open={createOpen}
            onOpenChange={setCreateOpen}
            onCreated={(agent) => {
              setAgents(
                [...agents.filter((item) => item.id !== agent.id), agent].sort(
                  (a, b) => a.id.localeCompare(b.id),
                ),
              );
              setSelectedAgentId(agent.id);
            }}
          />
        </div>

        {agents.length === 0 ? (
          <Empty className="min-h-[50vh] border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BotIcon />
              </EmptyMedia>
              <EmptyTitle>No agents yet</EmptyTitle>
              <EmptyDescription>
                Create a specialist to extend what the orchestrator can do.
                Attach skills from the Skills library when you create one.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateOpen(true)}>
                Create agent
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Fleet registry</CardTitle>
                <CardDescription>
                  Click an agent to inspect skills and status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Skills</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => {
                      const Icon = agentIcon(agent.capabilities);
                      const meta = statusMeta[agent.status];
                      const isSelected = selected?.id === agent.id;
                      return (
                        <TableRow
                          key={agent.id}
                          data-state={isSelected ? "selected" : undefined}
                          className="hover:cursor-pointer"
                          onClick={() => setSelectedAgentId(agent.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                                <Icon />
                              </span>
                              <div className="flex flex-col">
                                <span className="font-mono text-sm font-medium">
                                  {agent.id}
                                </span>
                                <span className="line-clamp-1 text-xs text-muted-foreground">
                                  {agent.description}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={meta.badge}>{meta.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {agent.capabilities.length === 0 ? (
                                <span className="text-xs text-muted-foreground">
                                  —
                                </span>
                              ) : (
                                agent.capabilities.map((capability) => (
                                  <Badge key={capability} variant="secondary">
                                    {capability}
                                  </Badge>
                                ))
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {selected && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-mono">{selected.id}</CardTitle>
                  <CardDescription>{selected.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={statusMeta[selected.status].badge}>
                      {statusMeta[selected.status].label}
                    </Badge>
                    {selected.capabilities.map((capability) => (
                      <Badge key={capability} variant="secondary">
                        {capability}
                      </Badge>
                    ))}
                  </div>

                  {selected.model && (
                    <p className="font-mono text-xs text-muted-foreground">
                      model · {selected.model}
                    </p>
                  )}

                  {selected.status !== "active" ? (
                    <Alert>
                      <CircleAlertIcon />
                      <AlertTitle>Inactive</AlertTitle>
                      <AlertDescription>
                        Activate this agent to let the orchestrator use it
                        during runs.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <CircleAlertIcon />
                      <AlertTitle>Active</AlertTitle>
                      <AlertDescription>
                        The orchestrator can call this agent during runs once
                        tools are attached.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgentsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <AgentsPageContent />
    </Suspense>
  );
}
