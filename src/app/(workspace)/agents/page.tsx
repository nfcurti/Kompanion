"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BotIcon } from "lucide-react";

import { CreateAgentSheet } from "@/components/agents/create-agent-sheet";
import { agentIcon, statusMeta } from "@/components/agents/agent-meta";
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

function AgentsFleetPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const { agents, setAgents, setSelectedAgentId } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (focus) router.replace(`/agents/${focus}`);
  }, [focus, router]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Agents</h1>
            <p className="text-sm text-muted-foreground">
              Fleet of specialists the orchestrator can call when they are
              active. Open an agent to manage it.
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
              router.push(`/agents/${agent.id}`);
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
              <Button onClick={() => setCreateOpen(true)}>Create agent</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Fleet</CardTitle>
              <CardDescription>
                Click an agent to open its management view.
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
                    return (
                      <TableRow
                        key={agent.id}
                        className="hover:cursor-pointer"
                        onClick={() => router.push(`/agents/${agent.id}`)}
                      >
                        <TableCell>
                          <Link
                            href={`/agents/${agent.id}`}
                            className="flex items-center gap-2"
                            onClick={(event) => event.stopPropagation()}
                          >
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
                          </Link>
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
      <AgentsFleetPage />
    </Suspense>
  );
}
