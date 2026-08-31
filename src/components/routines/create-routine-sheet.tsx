"use client";

import { PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useWorkspace } from "@/components/workspace/workspace-provider";
import {
  ROUTINE_CADENCES,
  ROUTINE_CALLBACKS,
  type Routine,
  type RoutineCadenceSeconds,
  type RoutineCallbackKind,
  type RoutineStatus,
} from "@/lib/routines";

type CreateRoutineSheetProps = {
  onCreated: (routine: Routine) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateRoutineSheet({
  onCreated,
  open: controlledOpen,
  onOpenChange,
}: CreateRoutineSheetProps) {
  const { agents } = useWorkspace();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  const bindableAgents = useMemo(
    () => agents.filter((agent) => agent.capabilities.length > 0),
    [agents],
  );

  const [name, setName] = useState("");
  const [agentId, setAgentId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [cadenceSeconds, setCadenceSeconds] =
    useState<RoutineCadenceSeconds>(3600);
  const [callback, setCallback] = useState<RoutineCallbackKind | "">("");
  const [status, setStatus] = useState<RoutineStatus>("active");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setAgentId("");
    setPrompt("");
    setCadenceSeconds(3600);
    setCallback("");
    setStatus("active");
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!agentId) {
      toast.error("Pick an agent.");
      return;
    }

    setSubmitting(true);
    try {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          agentId,
          prompt: prompt.trim(),
          callback: callback || undefined,
          cadenceSeconds,
          status,
          timezone,
        }),
      });

      const payload = (await response.json()) as {
        routine?: Routine;
        error?: string;
      };

      if (!response.ok || !payload.routine) {
        throw new Error(payload.error || "Failed to create routine");
      }

      onCreated(payload.routine);
      toast.success(`Created ${payload.routine.name}`);
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create routine",
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
          New routine
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col data-[side=right]:sm:max-w-3xl!">
        <SheetHeader>
          <SheetTitle>New routine</SheetTitle>
          <SheetDescription>
            Attach repeating work to one agent. On each tick they use every
            capability you already assigned to them. Results land in Studio.
          </SheetDescription>
        </SheetHeader>

        <form
          id="create-routine-form"
          onSubmit={onSubmit}
          className="flex flex-1 flex-col gap-4 overflow-y-auto px-4"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="routine-name">Name</FieldLabel>
              <Input
                id="routine-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Check inventory every hour"
                required
                maxLength={80}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="routine-agent">Agent</FieldLabel>
              <Select
                value={agentId || undefined}
                onValueChange={setAgentId}
                disabled={submitting || bindableAgents.length === 0}
              >
                <SelectTrigger id="routine-agent" className="hover:cursor-pointer">
                  <SelectValue placeholder="Select an agent" />
                </SelectTrigger>
                <SelectContent>
                  {bindableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name || agent.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="routine-prompt">Task</FieldLabel>
              <Textarea
                id="routine-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Open the catalog and list items that are out of stock."
                required
                rows={5}
                maxLength={4000}
              />
              <FieldDescription>
                Sent to the agent on every tick. They pick which capabilities to use.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="routine-callback">Callback</FieldLabel>
              <Select
                value={callback || "none"}
                onValueChange={(value) =>
                  setCallback(
                    value === "none" ? "" : (value as RoutineCallbackKind),
                  )
                }
                disabled={submitting}
              >
                <SelectTrigger
                  id="routine-callback"
                  className="hover:cursor-pointer"
                >
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {ROUTINE_CALLBACKS.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Every successful tick already shows up in Studio. Pick a
                follow-up if you want a named action on top.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="routine-cadence">Cadence</FieldLabel>  
              <Select
                value={String(cadenceSeconds)}
                onValueChange={(value) =>
                  setCadenceSeconds(Number(value) as RoutineCadenceSeconds)
                }
                disabled={submitting}
              >
                <SelectTrigger
                  id="routine-cadence"
                  className="hover:cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROUTINE_CADENCES.map((item) => (
                    <SelectItem key={item.seconds} value={String(item.seconds)}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="routine-status">Start as</FieldLabel>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as RoutineStatus)}
                disabled={submitting}
              >
                <SelectTrigger
                  id="routine-status"
                  className="hover:cursor-pointer"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active (schedule ticks)</SelectItem>
                  <SelectItem value="draft">Draft (no schedule)</SelectItem>
                </SelectContent>
              </Select>
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
          <Button
            type="submit"
            form="create-routine-form"
            disabled={submitting || bindableAgents.length === 0}
          >
            {submitting ? "Creating…" : "Create routine"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
