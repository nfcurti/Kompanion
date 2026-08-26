"use client";

import {
  ChevronDownIcon,
  KeyRoundIcon,
  PlayIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  WrenchIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { AgentManifest } from "@/agents/types";
import {
  SkillAuthFields,
  draftToSkillAuth,
  skillAuthToDraft,
  type SkillAuthDraft,
} from "@/components/skills/skill-auth-fields";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Skill } from "@/lib/skills";
import { cn } from "@/lib/utils";

type SkillTestTool = {
  id: string;
  name: string;
  input?: unknown;
  output?: unknown;
  state: "running" | "done";
};

type SkillTestEvent =
  | { type: "status"; message?: string }
  | { type: "tool-start"; id?: string; name?: string; input?: unknown }
  | { type: "tool-end"; id?: string; output?: unknown }
  | { type: "text-delta"; text?: string }
  | { type: "finish"; finishReason?: string; durationMs?: number }
  | { type: "error"; error?: string };

function toolCallOk(output: unknown): boolean | undefined {
  if (!output || typeof output !== "object" || !("ok" in output)) {
    return undefined;
  }
  return Boolean((output as { ok?: unknown }).ok);
}

function SkillTestToolCall({
  tool,
  callNumber,
}: {
  tool: SkillTestTool;
  callNumber: number;
}) {
  const ok = toolCallOk(tool.output);
  const running = tool.state === "running";

  return (
    <Collapsible
      defaultOpen={false}
      className="group overflow-hidden rounded-lg border bg-muted/30"
    >
      <CollapsibleTrigger className="hover:cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left">
        {running ? (
          <Spinner className="size-3.5 shrink-0" />
        ) : (
          <WrenchIcon className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <span className="min-w-0 flex-1 truncate font-mono text-xs font-medium">
          {callNumber}. {tool.name}
        </span>
        {running ? (
          <Badge variant="outline">running</Badge>
        ) : ok === undefined ? null : (
          <Badge variant={ok ? "secondary" : "destructive"}>
            {ok ? "ok" : "failed"}
          </Badge>
        )}
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Separator />
        <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {JSON.stringify({ input: tool.input, output: tool.output }, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SkillTestPanel({ skill }: { skill: Skill }) {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [tools, setTools] = useState<SkillTestTool[]>([]);
  const [text, setText] = useState("");
  const [finishReason, setFinishReason] = useState<string | undefined>();
  const [durationMs, setDurationMs] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);

  function upsertTool(next: SkillTestTool) {
    setTools((current) => {
      const index = current.findIndex((tool) => tool.id === next.id);
      if (index === -1) return [...current, next];
      return current.map((tool, toolIndex) =>
        toolIndex === index ? { ...tool, ...next } : tool,
      );
    });
  }

  async function runTest() {
    const task = prompt.trim();
    if (!task || running) return;
    setRunning(true);
    setStatus("Starting…");
    setTools([]);
    setText("");
    setFinishReason(undefined);
    setDurationMs(undefined);
    setError(null);

    try {
      const response = await fetch(`/api/skills/${skill.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: task }),
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Couldn’t run this capability");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          let event: SkillTestEvent;
          try {
            event = JSON.parse(line) as SkillTestEvent;
          } catch {
            continue;
          }
          if (event.type === "status" && event.message) {
            setStatus(event.message);
          } else if (event.type === "tool-start" && event.id && event.name) {
            upsertTool({
              id: event.id,
              name: event.name,
              input: event.input,
              state: "running",
            });
          } else if (event.type === "tool-end" && event.id) {
            const toolId = event.id;
            const output = event.output;
            setTools((current) => {
              const index = current.findIndex((tool) => tool.id === toolId);
              if (index === -1) {
                return [
                  ...current,
                  {
                    id: toolId,
                    name: "tool",
                    output,
                    state: "done",
                  },
                ];
              }
              return current.map((tool, toolIndex) =>
                toolIndex === index
                  ? { ...tool, output, state: "done" }
                  : tool,
              );
            });
          } else if (event.type === "text-delta" && event.text) {
            setText((current) => `${current}${event.text}`);
          } else if (event.type === "finish") {
            setFinishReason(event.finishReason);
            setDurationMs(event.durationMs);
            setStatus(null);
          } else if (event.type === "error") {
            const message = event.error || "Couldn’t run this capability";
            setError(message);
            setStatus(null);
            toast.error(message);
          }
        }
      }
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Couldn’t run this capability";
      setError(message);
      setStatus(null);
      toast.error(message);
    } finally {
      setRunning(false);
      setTools((current) =>
        current.map((tool) =>
          tool.state === "running" ? { ...tool, state: "done" } : tool,
        ),
      );
    }
  }

  const hasRun = running || tools.length > 0 || Boolean(text) || Boolean(error);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-border p-5">
        <p className="text-sm text-muted-foreground">
          Run this capability on its own. This does not go through Studio or
          another agent.
        </p>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={`e.g. ${skill.description || "Give it a concrete job"}`}
          rows={4}
          disabled={running}
          aria-label="Try this capability"
        />
        <Button
          type="button"
          disabled={running || !prompt.trim()}
          onClick={() => void runTest()}
          className="self-start"
        >
          {running ? <Spinner /> : <PlayIcon />}
          {running ? "Running…" : "Run test"}
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {!hasRun ? (
          <p className="text-sm text-muted-foreground">
            No run yet. Save login first if this capability needs a signed-in
            session.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
              {running ? (
                <span>{status || "Running…"}</span>
              ) : finishReason ? (
                <span>finish · {finishReason}</span>
              ) : null}
              {durationMs != null ? (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span>
                    {durationMs < 1000
                      ? `${durationMs} ms`
                      : `${(durationMs / 1000).toFixed(1)} s`}
                  </span>
                </>
              ) : null}
              {tools.length > 0 ? (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span>
                {tools.length} step{tools.length === 1 ? "" : "s"}
                  </span>
                </>
              ) : null}
            </div>
            {error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : null}
            {tools.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] text-muted-foreground">
                  Steps
                </p>
                {tools.map((tool, index) => (
                  <SkillTestToolCall
                    key={tool.id}
                    tool={tool}
                    callNumber={index + 1}
                  />
                ))}
              </div>
            ) : running ? (
              <p className="text-sm text-muted-foreground">
                {status || "Waiting for the first step…"}
              </p>
            ) : null}
            {text || (!running && !error) ? (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] text-muted-foreground">
                  Output
                </p>
                <pre className="rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                  {text || (running ? "…" : "(empty)")}
                </pre>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function agentsUsingSkill(agents: AgentManifest[], skillId: string) {
  return agents.filter((agent) => agent.capabilities.includes(skillId));
}

export function SkillsWorkspace({
  skills,
  agents,
  selectedId,
  onSelect,
  onSkillsChange,
  onAgentsChange,
}: {
  skills: Skill[];
  agents: AgentManifest[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onSkillsChange: (skills: Skill[]) => void;
  onAgentsChange: (agents: AgentManifest[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [authDraft, setAuthDraft] = useState<SkillAuthDraft>(
    skillAuthToDraft(undefined),
  );
  const [savingAuth, setSavingAuth] = useState(false);
  const [instructionsDraft, setInstructionsDraft] = useState("");
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return skills;
    return skills.filter((skill) =>
      [skill.id, skill.name, skill.description].some((value) =>
        value.toLowerCase().includes(needle),
      ),
    );
  }, [query, skills]);

  const selected =
    skills.find((skill) => skill.id === selectedId) ?? skills[0] ?? null;

  const boundAgents = selected
    ? agentsUsingSkill(agents, selected.id)
    : [];

  useEffect(() => {
    setAuthDraft(skillAuthToDraft(selected?.auth));
    setInstructionsDraft(selected?.instructions ?? "");
  }, [selected]);

  async function saveAuth() {
    if (!selected || savingAuth) return;
    setSavingAuth(true);
    try {
      const auth = draftToSkillAuth(authDraft);
      const response = await fetch(`/api/skills/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth: auth ?? null }),
      });
      const payload = (await response.json()) as {
        skill?: Skill;
        error?: string;
      };
      if (!response.ok || !payload.skill) {
        throw new Error(payload.error || "Failed to save login");
      }
      onSkillsChange(
        skills.map((item) =>
          item.id === payload.skill!.id ? payload.skill! : item,
        ),
      );
      toast.success("Login settings saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save login",
      );
    } finally {
      setSavingAuth(false);
    }
  }

  async function saveInstructions() {
    if (!selected || savingInstructions) return;
    const instructions = instructionsDraft.trim();
    if (!instructions) {
      toast.error("Instructions cannot be empty");
      return;
    }
    setSavingInstructions(true);
    try {
      const response = await fetch(`/api/skills/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions }),
      });
      const payload = (await response.json()) as {
        skill?: Skill;
        error?: string;
      };
      if (!response.ok || !payload.skill) {
        throw new Error(payload.error || "Failed to save instructions");
      }
      onSkillsChange(
        skills.map((item) =>
          item.id === payload.skill!.id ? payload.skill! : item,
        ),
      );
      toast.success("Instructions saved");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save instructions",
      );
    } finally {
      setSavingInstructions(false);
    }
  }

  async function deleteSelected() {
    if (!selected || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/skills/${selected.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as {
        error?: string;
        agents?: AgentManifest[];
      };
      if (!response.ok) {
        throw new Error(payload.error || "Couldn’t delete this capability");
      }
      const remaining = skills.filter((item) => item.id !== selected.id);
      onSkillsChange(remaining);
      if (payload.agents) onAgentsChange(payload.agents);
      onSelect(remaining[0]?.id ?? null);
      setConfirmDelete(false);
      toast.success(`Deleted ${selected.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Couldn’t delete this capability",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel defaultSize="30" minSize="22" maxSize="42">
        <div className="flex h-full min-h-0 flex-col border-r border-border bg-sidebar/40">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Library
              </p>
              <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                {filtered.length}/{skills.length}
              </span>
            </div>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Filter capabilities…"
                className="pl-8"
                aria-label="Filter capabilities"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Nothing matches that filter.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {filtered.map((skill) => {
                  const isSelected = selected?.id === skill.id;
                  const bound = agentsUsingSkill(agents, skill.id).length;
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => onSelect(skill.id)}
                      className={cn(
                        "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:cursor-pointer hover:bg-muted/70",
                        isSelected && "bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border",
                          isSelected
                            ? "border-border bg-background"
                            : "border-transparent bg-muted",
                        )}
                      >
                        <SparklesIcon className="size-3.5" />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-mono text-sm font-medium">
                            {skill.id}
                          </span>
                          {skill.auth?.enabled ? (
                            <KeyRoundIcon className="size-3 shrink-0 text-muted-foreground" />
                          ) : null}
                        </span>
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {skill.description}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {bound} agent{bound === 1 ? "" : "s"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize="70" minSize="40">
        {selected ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="flex flex-col gap-3 border-b border-border px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-mono text-base font-semibold tracking-tight">
                      {selected.id}
                    </h2>
                    <Badge variant="secondary">capability</Badge>
                    {selected.auth?.enabled ? (
                      <Badge variant="outline">login saved</Badge>
                    ) : (
                      <Badge variant="outline">no login</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {selected.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                    <span>
                      {boundAgents.length} agent
                      {boundAgents.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
                <AlertDialog
                  open={confirmDelete}
                  onOpenChange={(open) => {
                    if (!deleting) setConfirmDelete(open);
                  }}
                >
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="destructive" size="sm">
                      <Trash2Icon data-icon="inline-start" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Delete {selected.id}?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the capability and any saved login. This
                        cannot be undone.
                        {boundAgents.length > 0
                          ? ` It will also be removed from ${boundAgents.length} agent${boundAgents.length === 1 ? "" : "s"}: ${boundAgents.map((agent) => agent.id).join(", ")}.`
                          : ""}
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
                        onClick={() => void deleteSelected()}
                      >
                        {deleting ? "Deleting…" : "Delete"}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            <Tabs
              defaultValue="instructions"
              className="flex min-h-0 flex-1 flex-col gap-0"
            >
              <div className="border-b border-border px-5">
                <TabsList variant="line" className="h-9 w-full justify-start">
                  <TabsTrigger value="instructions" className="flex-none px-3">
                    Instructions
                  </TabsTrigger>
                  <TabsTrigger value="bindings" className="flex-none px-3">
                    Agents
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex-none px-3">
                    Login
                  </TabsTrigger>
                  <TabsTrigger value="test" className="flex-none px-3">
                    Try it
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="instructions"
                className="mt-0 min-h-0 flex-1 overflow-y-auto"
              >
                <div className="flex flex-col gap-3 p-5">
                  <p className="text-sm text-muted-foreground">
                    The playbook used when an agent works with this capability.
                    Save to apply to later chats, routines, and try-it runs.
                  </p>
                  <Textarea
                    value={instructionsDraft}
                    onChange={(event) =>
                      setInstructionsDraft(event.target.value)
                    }
                    aria-label="Capability instructions"
                    className="min-h-80 font-mono text-xs leading-relaxed"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={
                      savingInstructions ||
                      instructionsDraft.trim() === selected.instructions ||
                      !instructionsDraft.trim()
                    }
                    onClick={() => void saveInstructions()}
                    className="self-start"
                  >
                    {savingInstructions ? "Saving…" : "Save instructions"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="bindings"
                className="mt-0 min-h-0 flex-1 overflow-y-auto"
              >
                <div className="flex flex-col gap-3 p-5">
                  <p className="text-sm text-muted-foreground">
                    Agents that have this capability. Studio sends matching
                    work to them.
                  </p>
                  {boundAgents.length === 0 ? (
                    <div className="rounded-lg bg-muted/40 px-4 py-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
                      No agents have this yet. Add it when you create or edit
                      an agent.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {boundAgents.map((agent) => (
                        <Link
                          key={agent.id}
                          href={`/agents/${agent.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:cursor-pointer hover:bg-muted/60"
                        >
                          <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate font-mono font-medium">
                              {agent.id}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {agent.description}
                            </span>
                          </span>
                          <Badge variant="outline">{agent.status}</Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent
                value="auth"
                className="mt-0 min-h-0 flex-1 overflow-y-auto"
              >
                <div className="mx-auto flex w-full max-w-xl flex-col gap-4 p-5">
                  <p className="text-sm text-muted-foreground">
                    Optional site login for this capability. Credentials stay
                    here. Only an agent that has this capability can use them.
                  </p>
                  <SkillAuthFields
                    value={authDraft}
                    onChange={setAuthDraft}
                    passwordHint={
                      selected.auth?.password
                        ? "Leave blank to keep the saved password."
                        : undefined
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingAuth}
                    onClick={() => void saveAuth()}
                    className="self-start"
                  >
                    {savingAuth ? "Saving…" : "Save login"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent
                value="test"
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <SkillTestPanel key={selected.id} skill={selected} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Choose a capability from the list.
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
