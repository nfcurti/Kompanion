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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/workspace/page-header";
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <PageHeader
          title="Agents"
          description="People Studio can send work to. Open someone to change their capabilities and whether they can take requests."
        >
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
        </PageHeader>

        {agents.length === 0 ? (
          <Empty className="min-h-[40vh] ring-1 ring-foreground/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BotIcon />
              </EmptyMedia>
              <EmptyTitle>Add your first agent</EmptyTitle>
              <EmptyDescription>
                Give them a name, a description, and capabilities. Set them
                Active so Studio can send matching work their way.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateOpen(true)}>Create agent</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {agents.map((agent) => {
              const Icon = agentIcon(agent.capabilities);
              const meta = statusMeta[agent.status];
              return (
                <Link
                  key={agent.id}
                  href={`/agents/${agent.id}`}
                  className="group flex items-start gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10 transition-colors hover:cursor-pointer hover:bg-muted/40"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {agent.id}
                      </span>
                      <Badge variant={meta.badge}>{meta.label}</Badge>
                    </div>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {agent.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.length === 0 ? (
                        <span className="text-xs text-muted-foreground">
                          No capabilities yet
                        </span>
                      ) : (
                        agent.capabilities.map((capability) => (
                          <Badge key={capability} variant="secondary">
                            {capability}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
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
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      }
    >
      <AgentsFleetPage />
    </Suspense>
  );
}
