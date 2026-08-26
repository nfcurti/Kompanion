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
import { PageHeader } from "@/components/workspace/page-header";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export default function CapabilitiesPage() {
  const { agents, setAgents, skills, setSkills } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => skills[0]?.id ?? null,
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-6 pt-6 pb-4">
        <PageHeader
          title="Capabilities"
          description="Playbooks an agent can follow. Attach one to an agent, then ask Studio or set a routine."
        >
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
        </PageHeader>
      </div>

      {skills.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-start px-6 pb-6">
          <Empty className="min-h-[40vh] ring-1 ring-foreground/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SparklesIcon />
              </EmptyMedia>
              <EmptyTitle>Add your first capability</EmptyTitle>
              <EmptyDescription>
                Describe the work, write the steps, then give it to an agent.
                Studio picks that agent when the request matches.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setCreateOpen(true)}>
                New capability
              </Button>
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
