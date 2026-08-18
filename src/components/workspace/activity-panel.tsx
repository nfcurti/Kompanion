"use client";

import {
  ChevronDownIcon,
  CircleAlertIcon,
  LayersIcon,
  RadioIcon,
  WrenchIcon,
} from "lucide-react";
import { useMemo } from "react";

import { ORCHESTRATOR_MODEL } from "@/agents/orchestrator";
import { agentIcon, statusMeta } from "@/components/agents/agent-meta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkspace } from "@/components/workspace/workspace-provider";

type ToolEvent = {
  id: string;
  name: string;
  state: string;
  input?: unknown;
  output?: unknown;
};

function collectToolEvents(
  messages: ReturnType<typeof useWorkspace>["messages"],
): ToolEvent[] {
  const events: ToolEvent[] = [];
  for (const message of messages) {
    if (message.role !== "assistant") continue;
    message.parts.forEach((part, index) => {
      if (!part.type.startsWith("tool-")) return;
      const name = part.type.replace(/^tool-/, "");
      events.push({
        id: `${message.id}-${index}`,
        name,
        state: "state" in part ? String(part.state) : "unknown",
        input: "input" in part ? part.input : undefined,
        output: "output" in part ? part.output : undefined,
      });
    });
  }
  return events.reverse();
}

export function ActivityPanel() {
  const { agents, messages, status, selectedAgentId, setSelectedAgentId } =
    useWorkspace();

  const toolEvents = useMemo(() => collectToolEvents(messages), [messages]);
  const selected =
    agents.find((agent) => agent.id === selectedAgentId) ?? agents[0] ?? null;

  const busy = status === "submitted" || status === "streaming";
  const progressValue =
    status === "submitted" ? 35 : status === "streaming" ? 72 : 100;

  return (
    <div className="flex h-full min-h-0 flex-col bg-sidebar/40">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-medium">Activity</p>
          <p className="text-xs text-muted-foreground">
            Runs, tools, and agent fleet
          </p>
        </div>
        <Badge variant={busy ? "default" : "secondary"}>
          {busy ? "Running" : "Idle"}
        </Badge>
      </div>

      <Tabs defaultValue="run" className="flex min-h-0 flex-1 flex-col">
        <div className="px-3 pt-3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="run">Run</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="run" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-3">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <RadioIcon />
                    Orchestrator run
                  </CardTitle>
                  <CardDescription>
                    {busy
                      ? "Streaming response from the orchestrator loop."
                      : "Waiting for the next message."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Progress value={progressValue} />
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{ORCHESTRATOR_MODEL}</Badge>
                    <Badge variant="secondary">{messages.length} messages</Badge>
                    <Badge variant="secondary">{toolEvents.length} tools</Badge>
                  </div>
                </CardContent>
              </Card>

              {toolEvents.length === 0 ? (
                <Alert>
                  <WrenchIcon />
                  <AlertTitle>No tool calls yet</AlertTitle>
                  <AlertDescription>
                    When the orchestrator calls tools or delegates to agents,
                    each step will appear here with input and output.
                  </AlertDescription>
                </Alert>
              ) : (
                toolEvents.map((event) => (
                  <Collapsible
                    key={event.id}
                    defaultOpen={event.state !== "output-available"}
                    className="rounded-xl border border-border bg-card"
                  >
                    <CollapsibleTrigger className="hover:cursor-pointer flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm">
                      <WrenchIcon />
                      <span className="flex-1 font-medium">{event.name}</span>
                      <Badge variant="outline">{event.state}</Badge>
                      <ChevronDownIcon className="text-muted-foreground" />
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <Separator />
                      <div className="flex flex-col gap-2 p-3 font-mono text-[11px]">
                        <div>
                          <p className="mb-1 text-muted-foreground">input</p>
                          <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-foreground">
                            {JSON.stringify(event.input ?? null, null, 2)}
                          </pre>
                        </div>
                        {event.output !== undefined && (
                          <div>
                            <p className="mb-1 text-muted-foreground">output</p>
                            <pre className="overflow-x-auto rounded-lg bg-muted/50 p-2 text-foreground">
                              {JSON.stringify(event.output, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agents" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-3">
              {agents.length === 0 ? (
                <Alert>
                  <CircleAlertIcon />
                  <AlertTitle>No agents registered</AlertTitle>
                  <AlertDescription>
                    Use <span className="font-mono">registerAgent()</span> to
                    add specialists. The fleet starts empty on purpose.
                  </AlertDescription>
                </Alert>
              ) : (
                agents.map((agent) => {
                  const Icon = agentIcon(agent.capabilities);
                  const meta = statusMeta[agent.status];
                  const selected = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      type="button"
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={`hover:cursor-pointer rounded-xl border px-3 py-3 text-left transition-colors ${
                        selected
                          ? "border-foreground/20 bg-card"
                          : "border-border bg-transparent hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <Icon />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {agent.name}
                            </p>
                            <Badge variant={meta.badge}>{meta.label}</Badge>
                          </div>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {agent.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {agent.capabilities.map((capability) => (
                              <Badge key={capability} variant="secondary">
                                {capability}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="system" className="min-h-0 flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-3 p-3">
              <Card size="sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <LayersIcon />
                    Runtime
                  </CardTitle>
                  <CardDescription>
                    Gateway-backed GPT orchestrator with a pluggable agent registry.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Model</span>
                    <span className="font-mono text-xs">{ORCHESTRATOR_MODEL}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Transport</span>
                    <span>AI Gateway</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">Loop</span>
                    <span>ToolLoopAgent</span>
                  </div>
                </CardContent>
              </Card>

              {selected && (
                <Card size="sm">
                  <CardHeader>
                    <CardTitle className="text-sm">Selected agent</CardTitle>
                    <CardDescription>{selected.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-2 text-sm">
                    <p className="text-muted-foreground">{selected.description}</p>
                    {selected.status !== "active" && (
                      <Alert>
                        <CircleAlertIcon />
                        <AlertTitle>Not wired yet</AlertTitle>
                        <AlertDescription>
                          Mark this agent active and provide{" "}
                          <span className="font-mono">createTools</span> to
                          expose it to the orchestrator.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
