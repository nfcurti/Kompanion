"use client";

import { useState } from "react";
import { SparklesIcon } from "lucide-react";

import { CreateSkillSheet } from "@/components/skills/create-skill-sheet";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export default function SkillsPage() {
  const { skills, setSkills } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    skills.find((skill) => skill.id === selectedId) ?? skills[0] ?? null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Skills</h1>
            <p className="text-sm text-muted-foreground">
              Reusable instruction packs agents can attach — same idea as agent
              skills: name, when-to-use description, and a markdown body.
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
          <Empty className="min-h-[50vh] border border-dashed">
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
        ) : (
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Skill library</CardTitle>
                <CardDescription>
                  Click a skill to inspect its instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skills.map((skill) => {
                      const isSelected = selected?.id === skill.id;
                      return (
                        <TableRow
                          key={skill.id}
                          data-state={isSelected ? "selected" : undefined}
                          className="hover:cursor-pointer"
                          onClick={() => setSelectedId(skill.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                                <SparklesIcon className="size-4" />
                              </span>
                              <span className="font-mono text-sm font-medium">
                                {skill.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="line-clamp-2 text-xs text-muted-foreground">
                              {skill.description}
                            </span>
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
                <CardContent className="flex flex-col gap-3">
                  <Badge variant="secondary" className="w-fit">
                    Instructions
                  </Badge>
                  <pre className="max-h-[28rem] overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {selected.instructions}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
