"use client";

import { ArrowLeftIcon, CircleAlertIcon, Trash2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { CapabilitiesDropdown } from "@/components/agents/capabilities-dropdown";
import { AgentActions } from "@/components/agents/agent-actions";
import { StatusDropdown } from "@/components/agents/status-dropdown";
import { agentIcon, statusMeta } from "@/components/agents/agent-meta";
import type { AgentManifest, AgentStatus } from "@/agents/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function AgentDetail({ agentId }: { agentId: string }) {
  const router = useRouter();
  const { agents, setAgents, setSelectedAgentId } = useWorkspace();
  const agent = agents.find((item) => item.id === agentId) ?? null;

  const [description, setDescription] = useState("");
  const [behavior, setBehavior] = useState("");
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [status, setStatus] = useState<AgentStatus>("registered");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setSelectedAgentId(agentId);
  }, [agentId, setSelectedAgentId]);

  useEffect(() => {
    if (!agent) return;
    setDescription(agent.description);
    setBehavior(agent.behavior ?? "");
    setCapabilities(agent.capabilities);
    setStatus(agent.status);
    setModel(agent.model ?? "");
  }, [agent]);

  const dirty = useMemo(() => {
    if (!agent) return false;
    return (
      description.trim() !== agent.description ||
      (agent.behavior ?? "") !== behavior.trim() ||
      status !== agent.status ||
      (agent.model ?? "") !== model.trim() ||
      JSON.stringify(capabilities) !== JSON.stringify(agent.capabilities)
    );
  }, [agent, behavior, capabilities, description, model, status]);

  async function onSave() {
    if (!agent || saving || !dirty) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          behavior: behavior.trim(),
          status,
          capabilities,
          model: model.trim(),
        }),
      });
      const payload = (await response.json()) as {
        agent?: AgentManifest;
        error?: string;
      };
      if (!response.ok || !payload.agent) {
        throw new Error(payload.error || "Failed to save agent");
      }
      setAgents(
        agents.map((item) => (item.id === payload.agent!.id ? payload.agent! : item)),
      );
      toast.success(`Saved ${payload.agent.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save agent");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!agent || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        agents?: AgentManifest[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to delete agent");
      }
      setAgents(payload.agents ?? agents.filter((item) => item.id !== agent.id));
      setSelectedAgentId(null);
      toast.success(`Deleted ${agent.id}`);
      router.push("/agents");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete agent",
      );
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (!agent) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
          <Empty className="min-h-[40vh] ring-1 ring-foreground/10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CircleAlertIcon />
              </EmptyMedia>
              <EmptyTitle>Agent not found</EmptyTitle>
              <EmptyDescription>
                No agent named{" "}
                <span className="font-mono">{agentId}</span> yet.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/agents">Back to agents</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    );
  }

  const Icon = agentIcon(agent.capabilities);
  const meta = statusMeta[status];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Button variant="ghost" size="sm" className="w-fit px-0" asChild>
              <Link href="/agents">
                <ArrowLeftIcon data-icon="inline-start" />
                Agents
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon />
              </span>
              <div className="flex flex-col gap-1">
                <h1 className="font-mono text-2xl font-semibold tracking-tight">
                  {agent.id}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Profile, capabilities, and the last work this agent did.
                </p>
              </div>
            </div>
          </div>
          <Badge variant={meta.badge}>{meta.label}</Badge>
        </div>

        <Tabs defaultValue="profile" className="gap-6">
          <TabsList variant="line">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-0">
            <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Changes apply the next time Studio asks this agent to work.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="agent-description">Description</FieldLabel>
                <Textarea
                  id="agent-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <FieldDescription>
                  What they are for. Studio uses this to pick who should work.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="agent-behavior">Behavior</FieldLabel>
                <Textarea
                  id="agent-behavior"
                  value={behavior}
                  onChange={(event) => setBehavior(event.target.value)}
                  placeholder="How this agent should work, and how their results should be written…"
                  rows={6}
                  maxLength={4000}
                />
                <FieldDescription>
                  Instructions for this agent. Used when they run and when
                  Studio drafts from their tool output.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="agent-skills">Capabilities</FieldLabel>
                <CapabilitiesDropdown
                  id="agent-skills"
                  value={capabilities}
                  onChange={setCapabilities}
                  disabled={saving}
                />
                <FieldDescription>
                  What this agent can do when Studio or a routine asks.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="agent-status">Status</FieldLabel>
                <StatusDropdown
                  id="agent-status"
                  value={status}
                  onChange={setStatus}
                  disabled={saving}
                />
                <FieldDescription>
                  Only Active agents can be asked from Studio.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="agent-model">Model override</FieldLabel>
                <Input
                  id="agent-model"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder="Use the workspace default"
                  className="font-mono"
                />
              </Field>
            </FieldGroup>

            {status !== "active" ? (
              <Alert>
                <CircleAlertIcon />
                <AlertTitle>Inactive</AlertTitle>
                <AlertDescription>
                  Set status to Active so Studio can ask this agent.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CircleAlertIcon />
                <AlertTitle>Active</AlertTitle>
                <AlertDescription>
                  Studio can ask this agent when the request matches their
                  description and capabilities.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <AlertDialog
                open={confirmDelete}
                onOpenChange={(open) => {
                  if (!deleting) setConfirmDelete(open);
                }}
              >
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline">
                    <Trash2Icon data-icon="inline-start" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {agent.id}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the agent. Their capabilities stay in your
                      library.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={deleting}>
                      Cancel
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={deleting}
                      onClick={() => void onDelete()}
                    >
                      {deleting ? "Deleting…" : "Delete agent"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="button"
                disabled={saving || !dirty || !description.trim()}
                onClick={() => void onSave()}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="actions" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Last work this agent did from Studio or a routine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgentActions agentId={agent.id} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
