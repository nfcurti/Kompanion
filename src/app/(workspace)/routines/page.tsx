"use client";

import { PlusIcon, RepeatIcon } from "lucide-react";
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
import { PageHeader } from "@/components/workspace/page-header";
import { listRoutines } from "@/lib/routines";

export default function RoutinesPage() {
  const routines = listRoutines();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-6">
        <PageHeader
          title="Routines"
          description="Habits that keep running on a schedule or when something arrives, without you sitting in Studio."
        >
          <Button disabled>
            <PlusIcon data-icon="inline-start" />
            New routine
          </Button>
        </PageHeader>

        {routines.length === 0 ? (
          <Empty className="min-h-[40vh] ring-1 ring-foreground/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <RepeatIcon />
              </EmptyMedia>
              <EmptyTitle>No routines yet</EmptyTitle>
              <EmptyDescription>
                A routine is when to run, what to ask, and which agent should
                handle it. Each run shows up in Activity and Budget. Teach the
                agent how under Capabilities.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline">
                  <Link href="/capabilities">Open capabilities</Link>
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
