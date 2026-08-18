"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { BotIcon, CircleAlertIcon } from "lucide-react";

import {
  agentIcon,
  statusMeta,
} from "@/components/agents/agent-meta";
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
  const { agents, selectedAgentId, setSelectedAgentId } = useWorkspace();

  useEffect(() => {
    if (focus) setSelectedAgentId(focus);
  }, [focus, setSelectedAgentId]);

  const selected =
    agents.find((agent) => agent.id === (selectedAgentId ?? focus)) ??
    agents[0] ??
    null;

  const activeCount = agents.filter((agent) => agent.status === "active").length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="text-sm text-muted-foreground">
              Register specialists here. Active agents expose tools to the
              orchestrator via <span className="font-mono">createTools</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{activeCount} active</Badge>
            <Badge variant="outline">{agents.length} total</Badge>
          </div>
        </div>

        {agents.length === 0 ? (
          <Empty className="min-h-[50vh] border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BotIcon />
              </EmptyMedia>
              <EmptyTitle>No agents registered</EmptyTitle>
              <EmptyDescription>
                Call <span className="font-mono">registerAgent(...)</span> from
                server code to add agents to the registry. Nothing is seeded by
                default.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Fleet registry</CardTitle>
                <CardDescription>
                  Click an agent to inspect capabilities and status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Capabilities</TableHead>
                      <TableHead className="text-right">ID</TableHead>
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
                                <span className="font-medium">{agent.name}</span>
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
                              {agent.capabilities.map((capability) => (
                                <Badge key={capability} variant="secondary">
                                  {capability}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {agent.id}
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
                  <CardTitle>{selected.name}</CardTitle>
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

                  {selected.status !== "active" ? (
                    <Alert>
                      <CircleAlertIcon />
                      <AlertTitle>Not active</AlertTitle>
                      <AlertDescription>
                        Set <span className="font-mono">status: &quot;active&quot;</span>{" "}
                        and provide{" "}
                        <span className="font-mono">createTools</span> to expose
                        this agent to the orchestrator.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <CircleAlertIcon />
                      <AlertTitle>Wired into orchestrator</AlertTitle>
                      <AlertDescription>
                        Tools from this agent are merged into the ToolLoopAgent
                        at request time.
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button variant="outline" disabled>
                    Deploy agent
                  </Button>
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
