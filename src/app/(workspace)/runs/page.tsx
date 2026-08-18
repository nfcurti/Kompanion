"use client";

import { HistoryIcon } from "lucide-react";
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
import { listRuns } from "@/lib/runs";

export default function RunsPage() {
  const runs = listRuns();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Runs</h1>
          <p className="text-sm text-muted-foreground">
            Execution history for playground sessions and automations.
          </p>
        </div>

        {runs.length === 0 ? (
          <Empty className="min-h-[50vh] border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HistoryIcon />
              </EmptyMedia>
              <EmptyTitle>No runs yet</EmptyTitle>
              <EmptyDescription>
                Runs will show up here after persistence is wired. Use the
                playground to exercise the orchestrator in the meantime.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/playground">Open playground</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : null}
      </div>
    </div>
  );
}
