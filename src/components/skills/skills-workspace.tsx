"use client";

import { KeyRoundIcon, PlayIcon, SearchIcon, SparklesIcon } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  name: string;
  input: unknown;
  output: unknown;
};

type SkillTestStep = {
  stepNumber: number;
  text?: string;
  tools: SkillTestTool[];
};

type SkillTestResult = {
  text: string;
  finishReason?: string;
  durationMs?: number;
  steps: SkillTestStep[];
  error?: string;
};

function SkillTestPanel({ skill }: { skill: Skill }) {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SkillTestResult | null>(null);

  async function runTest() {
    const task = prompt.trim();
    if (!task || running) return;
    setRunning(true);
    setResult(null);
    try {
      const response = await fetch(`/api/skills/${skill.id}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: task }),
      });
      const payload = (await response.json()) as SkillTestResult & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Skill test failed");
      }
      setResult({
        text: payload.text ?? "",
        finishReason: payload.finishReason,
        durationMs: payload.durationMs,
        steps: payload.steps ?? [],
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Skill test failed";
      setResult({ text: "", steps: [], error: message });
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  const toolCount =
    result?.steps.reduce((count, step) => count + step.tools.length, 0) ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-3 border-b border-border p-5">
        <p className="text-sm text-muted-foreground">
          Run this skill alone with HTTP fetch or the Chromium browser tools.
          This does not go through Studio routing or a bound agent.
        </p>
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder={`e.g. ${skill.description || "Give the skill a concrete task"}`}
          rows={4}
          disabled={running}
          aria-label="Skill test prompt"
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
        {running ? (
          <p className="text-sm text-muted-foreground">
            Running the skill. Login and fetches can take a while.
          </p>
        ) : result?.error ? (
          <p className="text-sm text-destructive">{result.error}</p>
        ) : result ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-muted-foreground">
              {result.finishReason ? (
                <span>finish · {result.finishReason}</span>
              ) : null}
              {result.durationMs != null ? (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span>
                    {result.durationMs < 1000
                      ? `${result.durationMs} ms`
                      : `${(result.durationMs / 1000).toFixed(1)} s`}
                  </span>
                </>
              ) : null}
              <Separator orientation="vertical" className="h-3" />
              <span>
                {toolCount} tool call{toolCount === 1 ? "" : "s"}
              </span>
            </div>
            {result.steps.some((step) => step.tools.length > 0) ? (
              <div className="flex flex-col gap-2">
                <p className="font-mono text-[11px] text-muted-foreground">
                  Tool trace
                </p>
                {result.steps.flatMap((step) =>
                  step.tools.map((tool, index) => (
                    <div
                      key={`${step.stepNumber}-${tool.name}-${index}`}
                      className="flex flex-col gap-1 rounded-lg border bg-muted/30 p-3"
                    >
                      <p className="font-mono text-xs font-medium">
                        {tool.name}
                      </p>
                      <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-muted-foreground">
                        {JSON.stringify(
                          { input: tool.input, output: tool.output },
                          null,
                          2,
                        )}
                      </pre>
                    </div>
                  )),
                )}
              </div>
            ) : null}
            <div className="flex flex-col gap-2">
              <p className="font-mono text-[11px] text-muted-foreground">
                Output
              </p>
              <pre className="rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                {result.text || "(empty)"}
              </pre>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No run yet. Save login first if this skill needs a session.
          </p>
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
}: {
  skills: Skill[];
  agents: AgentManifest[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onSkillsChange: (skills: Skill[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [authDraft, setAuthDraft] = useState<SkillAuthDraft>(
    skillAuthToDraft(undefined),
  );
  const [savingAuth, setSavingAuth] = useState(false);

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

  return (
    <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
      <ResizablePanel defaultSize="30" minSize="22" maxSize="42">
        <div className="flex h-full min-h-0 flex-col border-r border-border bg-sidebar/40">
          <div className="flex flex-col gap-2 border-b border-border px-3 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Registry
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
                placeholder="Filter skills…"
                className="pl-8"
                aria-label="Filter skills"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
            {filtered.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                No skills match that filter.
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
                          {bound} bound
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
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-mono text-base font-semibold tracking-tight">
                  {selected.id}
                </h2>
                <Badge variant="secondary">skill</Badge>
                {selected.auth?.enabled ? (
                  <Badge variant="outline">auth</Badge>
                ) : (
                  <Badge variant="outline">stateless</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {selected.description}
              </p>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-muted-foreground">
                <span>id · {selected.id}</span>
                <Separator orientation="vertical" className="h-3" />
                <span>
                  bound · {boundAgents.length} agent
                  {boundAgents.length === 1 ? "" : "s"}
                </span>
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
                    Bindings
                  </TabsTrigger>
                  <TabsTrigger value="auth" className="flex-none px-3">
                    Auth
                  </TabsTrigger>
                  <TabsTrigger value="test" className="flex-none px-3">
                    Test
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="instructions"
                className="mt-0 min-h-0 flex-1 overflow-y-auto"
              >
                <div className="flex flex-col gap-2 p-5">
                  <p className="font-mono text-[11px] text-muted-foreground">
                    SKILL.md
                  </p>
                  <pre className="rounded-lg border bg-muted/30 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                    {selected.instructions}
                  </pre>
                </div>
              </TabsContent>

              <TabsContent
                value="bindings"
                className="mt-0 min-h-0 flex-1 overflow-y-auto"
              >
                <div className="flex flex-col gap-3 p-5">
                  <p className="text-sm text-muted-foreground">
                    Agents that list this skill in their capabilities. The
                    orchestrator injects the skill body when those agents run.
                  </p>
                  {boundAgents.length === 0 ? (
                    <div className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                      No agents bound yet. Attach this skill when creating an
                      agent.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {boundAgents.map((agent) => (
                        <Link
                          key={agent.id}
                          href={`/agents?focus=${agent.id}`}
                          className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
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
                    Optional site session for this skill. Credentials stay on
                    the skill and are used by skillLogin / skillFetch or the
                    Chromium browser tools.
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
            Select a skill from the registry.
          </div>
        )}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
