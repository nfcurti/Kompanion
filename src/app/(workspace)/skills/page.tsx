"use client";

import { useState } from "react";
import { SparklesIcon } from "lucide-react";

import { CreateSkillSheet } from "@/components/skills/create-skill-sheet";
import { SkillsWorkspace } from "@/components/skills/skills-workspace";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export default function SkillsPage() {
  const { agents, setAgents, skills, setSkills } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => skills[0]?.id ?? null,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-medium">Skills</h1>
          <p className="text-xs text-muted-foreground">
            Instruction packs the orchestrator binds onto agents at runtime.
          </p>
        </div>
        <CreateSkillSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreated={(skill) => {
            setSkills(
              [...skills.filter((item) => item.id !== skill.id), skill].sort(
                (a, b) => a.id.localeCompare(b.id),
              ),
            );
            setSelectedId(skill.id);
          }}
        />
      </div>

      {skills.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6">
          <Empty className="max-w-md border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SparklesIcon />
              </EmptyMedia>
              <EmptyTitle>No skills yet</EmptyTitle>
              <EmptyDescription>
                Create a skill first, then attach it when you create an agent.
                Skills are the only options in the agent capabilities picker.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateOpen(true)}>Create skill</Button>
            </EmptyContent>
          </Empty>
        </div>
      ) : (
        <SkillsWorkspace
          skills={skills}
          agents={agents}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onSkillsChange={setSkills}
          onAgentsChange={setAgents}
        />
      )}
    </div>
  );
}
