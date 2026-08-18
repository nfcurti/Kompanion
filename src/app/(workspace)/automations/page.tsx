"use client";

import { PlusIcon, WorkflowIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { listAutomations } from "@/lib/automations";

export default function AutomationsPage() {
  const automations = listAutomations();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Automations</h1>
            <p className="text-sm text-muted-foreground">
              Scheduled and triggered workflows that run through the orchestrator.
            </p>
          </div>
          <Button disabled>
            <PlusIcon data-icon="inline-start" />
            New automation
          </Button>
        </div>

        {automations.length === 0 ? (
          <Empty className="min-h-[50vh] border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <WorkflowIcon />
              </EmptyMedia>
              <EmptyTitle>No automations yet</EmptyTitle>
              <EmptyDescription>
                Automations will appear here once you create them. Deploy agents
                first, then wire workflows that call them.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild variant="outline">
                <Link href="/agents">Open agents</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : null}
      </div>
    </div>
  );
}
