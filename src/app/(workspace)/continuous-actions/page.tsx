"use client";

import { PlusIcon, TimerIcon } from "lucide-react";
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
import { listContinuousActions } from "@/lib/continuous-actions";

export default function ContinuousActionsPage() {
  const actions = listContinuousActions();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Continuous actions
            </h1>
            <p className="text-sm text-muted-foreground">
              Keep the orchestrator working in the background — on a schedule,
              on a webhook, or whenever a condition fires — without keeping
              Studio open.
            </p>
          </div>
          <Button disabled>
            <PlusIcon data-icon="inline-start" />
            New continuous action
          </Button>
        </div>

        {actions.length === 0 ? (
          <Empty className="min-h-[50vh] border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TimerIcon />
              </EmptyMedia>
              <EmptyTitle>No continuous actions yet</EmptyTitle>
              <EmptyDescription>
                Each action defines a trigger, a prompt or workflow, and
                which agents can help. Activity shows up in Studio while they
                run. Set defaults in Settings → Continuous actions.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/settings">Open settings</Link>
                </Button>
                <Button asChild>
                  <Link href="/playground">Open Studio</Link>
                </Button>
              </div>
            </EmptyContent>
          </Empty>
        ) : null}
      </div>
    </div>
  );
}
