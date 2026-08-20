"use client";

import { Loader2Icon, PlusIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { slugifyAgentId } from "@/lib/agent-id";
import type { Skill } from "@/lib/skills";

type CreateSkillSheetProps = {
  onCreated: (skill: Skill) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateSkillSheet({
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: CreateSkillSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [id, setId] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  function reset() {
    setId("");
    setDescription("");
    setInstructions("");
  }

  async function generateWithAi() {
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      toast.error("Add a description first");
      return;
    }
    if (generating) return;

    setGenerating(true);
    try {
      const response = await fetch("/api/skills/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slugifyAgentId(id) || undefined,
          description: trimmedDescription,
        }),
      });

      const payload = (await response.json()) as {
        instructions?: string;
        error?: string;
      };

      if (!response.ok || !payload.instructions) {
        throw new Error(payload.error || "Failed to generate instructions");
      }

      setInstructions(payload.instructions);
      toast.success("Instructions generated");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate instructions",
      );
    } finally {
      setGenerating(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting || generating) return;

    const normalizedId = slugifyAgentId(id);
    if (!normalizedId) {
      toast.error("Enter a valid skill id");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: normalizedId,
          description: description.trim(),
          instructions: instructions.trim(),
        }),
      });

      const payload = (await response.json()) as {
        skill?: Skill;
        error?: string;
      };

      if (!response.ok || !payload.skill) {
        throw new Error(payload.error || "Failed to create skill");
      }

      onCreated(payload.skill);
      toast.success(`Created ${payload.skill.id}`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create skill",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          Create skill
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col data-[side=right]:sm:max-w-3xl!">
        <SheetHeader>
          <SheetTitle>Create skill</SheetTitle>
          <SheetDescription>
            Skills are reusable instructions agents can apply — like a SKILL.md
            with a name, when-to-use description, and body.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-skill-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="skill-id">ID</FieldLabel>
              <Input
                id="skill-id"
                value={id}
                onChange={(event) => setId(event.target.value)}
                onBlur={() => setId(slugifyAgentId(id))}
                placeholder="web-search"
                className="font-mono"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
              />
              <FieldDescription>
                Lowercase letters, numbers, and hyphens. Agents attach skills by
                this id.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="skill-description">Description</FieldLabel>
              <Textarea
                id="skill-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this skill does and when the agent should use it…"
                required
                rows={3}
                maxLength={1024}
              />
              <FieldDescription>
                Used for discovery — include both what and when. Also feeds
                Create with AI for instructions.
              </FieldDescription>
            </Field>

            <Field>
              <div className="flex w-full items-center justify-between gap-2">
                <FieldLabel htmlFor="skill-instructions">
                  Instructions
                </FieldLabel>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Create with AI"
                        disabled={generating || submitting}
                        onClick={() => void generateWithAi()}
                      >
                        {generating ? (
                          <Loader2Icon className="animate-spin" />
                        ) : (
                          <SparklesIcon />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create with AI</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Textarea
                id="skill-instructions"
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                placeholder={`# Web search\n\n## Instructions\n1. …\n\n## Examples\n…`}
                required
                rows={14}
                className="font-mono text-sm"
                disabled={generating}
              />
              <FieldDescription>
                Markdown body the agent follows when this skill is attached.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting || generating}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-skill-form"
            disabled={submitting || generating}
          >
            {submitting ? "Creating…" : "Create skill"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
