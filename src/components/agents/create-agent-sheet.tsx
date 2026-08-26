"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CapabilitiesDropdown } from "@/components/agents/capabilities-dropdown";
import { StatusDropdown } from "@/components/agents/status-dropdown";
import type { AgentManifest, AgentStatus } from "@/agents/types";
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
import { slugifyAgentId } from "@/lib/agent-id";

type CreateAgentSheetProps = {
  onCreated: (agent: AgentManifest) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateAgentSheet({
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: CreateAgentSheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const [id, setId] = useState("");
  const [description, setDescription] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [status, setStatus] = useState<AgentStatus>("registered");
  const [model, setModel] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setId("");
    setDescription("");
    setCapabilities([]);
    setStatus("registered");
    setModel("");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const normalizedId = slugifyAgentId(id);
    if (!normalizedId) {
      toast.error("Enter a valid agent id");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: normalizedId,
          description: description.trim(),
          status,
          capabilities,
          model: model.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as {
        agent?: AgentManifest;
        error?: string;
      };

      if (!response.ok || !payload.agent) {
        throw new Error(payload.error || "Failed to create agent");
      }

      onCreated(payload.agent);
      toast.success(`Created ${payload.agent.id}`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create agent",
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
          Create agent
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col data-[side=right]:sm:max-w-3xl!">
        <SheetHeader>
          <SheetTitle>Create agent</SheetTitle>
          <SheetDescription>
            Add someone Studio can send work to. Give them capabilities from
            your library. They handle site login and browsing, not this chat.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-agent-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="agent-id">ID</FieldLabel>
              <Input
                id="agent-id"
                value={id}
                onChange={(event) => setId(event.target.value)}
                onBlur={() => setId(slugifyAgentId(id))}
                placeholder="web-researcher"
                className="font-mono"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                required
              />
              <FieldDescription>
                Lowercase letters, numbers, and hyphens. This is how you’ll
                recognize them in the list.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="agent-description">Description</FieldLabel>
              <Textarea
                id="agent-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What this agent is responsible for…"
                required
                rows={4}
                maxLength={500}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="agent-capabilities">Capabilities</FieldLabel>
              <CapabilitiesDropdown
                id="agent-capabilities"
                value={capabilities}
                onChange={setCapabilities}
                disabled={submitting}
              />
              <FieldDescription>
                What this agent can do. Add capabilities first if the list is
                empty.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="agent-status">Status</FieldLabel>
              <StatusDropdown
                id="agent-status"
                value={status}
                onChange={setStatus}
                disabled={submitting}
              />
              <FieldDescription>
                Only Active agents can be asked to work from Studio.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="agent-model">Model override</FieldLabel>
              <Input
                id="agent-model"
                value={model}
                onChange={(event) => setModel(event.target.value)}
                placeholder="openai/gpt-5.5"
                className="font-mono"
              />
              <FieldDescription>
                Optional. Leave empty to use the workspace default model.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>

        <SheetFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" form="create-agent-form" disabled={submitting}>
            {submitting ? "Creating…" : "Create agent"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
