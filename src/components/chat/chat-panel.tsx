"use client";

import {
  ArrowUpIcon,
  BotIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CopyIcon,
  SquareIcon,
  WrenchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChatMarkdown } from "@/components/chat/chat-markdown";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import {
  formatStartedAgo,
  isSupervisorToolDone,
  looksLikeMarkdown,
  supervisorToolBadge,
  supervisorToolLabel,
} from "@/lib/tool-ui-labels";
import { cn } from "@/lib/utils";

const starters = [
  {
    title: "What can you do?",
    description: "See which active agents Studio can invoke",
    prompt: "What can you do right now, and which agents can you invoke?",
  },
  {
    title: "List agents",
    description: "Ask Studio to list the fleet with listAgents",
    prompt: "What agents are registered right now, and which are Active?",
  },
  {
    title: "Start a task",
    description: "Studio routes; the specialist runs the skill tools",
    prompt: "Help me get this done using the right specialist agent.",
  },
];

function ToolCallCard({
  name,
  state,
  input,
  output,
  preliminary,
}: {
  name: string;
  state: string;
  input?: unknown;
  output?: unknown;
  preliminary?: boolean;
}) {
  const { agents } = useWorkspace();
  const done = isSupervisorToolDone(state, preliminary, output);
  const badge = supervisorToolBadge(state, preliminary, output);
  const startedAtRef = useRef(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const agentId =
    input && typeof input === "object" && "agentId" in input
      ? String((input as { agentId?: unknown }).agentId ?? "")
      : "";
  const agentName = agents.find((agent) => agent.id === agentId)?.name ?? null;
  const label = supervisorToolLabel({
    name,
    input,
    output,
    state,
    preliminary,
    agentName,
  });

  useEffect(() => {
    const tick = () => setElapsedMs(Date.now() - startedAtRef.current);
    tick();
    if (done) return;
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [done]);

  return (
    <Collapsible
      defaultOpen={false}
      className="group overflow-hidden rounded-xl border border-border bg-background/60"
    >
      <CollapsibleTrigger className="hover:cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs">
        <WrenchIcon />
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
          {formatStartedAgo(elapsedMs)}
        </span>
        <Badge variant={done ? "secondary" : "outline"}>{badge}</Badge>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Separator />
        <div className="flex flex-col gap-2 p-3 font-mono text-[11px] text-muted-foreground">
          <pre className="overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify({ input, output }, null, 2)}
          </pre>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function MessageBubble({ message }: { message: OrchestratorMessage }) {
  const isUser = message.role === "user";

  async function copyText() {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Copied message");
  }

  return (
    <div
      className={cn(
        "group flex min-w-0",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 max-w-full flex-1 flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {isUser ? "You" : "Orchestrator"}
          </span>
        </div>

        <div
          className={cn(
            "w-full min-w-0 overflow-hidden rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground ring-1 ring-foreground/10",
          )}
        >
          <div className="flex flex-col gap-3">
            {message.parts.map((part, index) => {
              if (part.type === "text" && part.text) {
                if (!isUser && looksLikeMarkdown(part.text)) {
                  return (
                    <ChatMarkdown
                      key={`${message.id}-text-${index}`}
                      text={part.text}
                    />
                  );
                }
                return (
                  <p
                    key={`${message.id}-text-${index}`}
                    className="whitespace-pre-wrap text-sm leading-relaxed"
                  >
                    {part.text}
                  </p>
                );
              }

              if (part.type.startsWith("tool-")) {
                return (
                  <ToolCallCard
                    key={`${message.id}-tool-${index}`}
                    name={
                      part.type === "dynamic-tool" && "toolName" in part
                        ? String(part.toolName)
                        : part.type.replace(/^tool-/, "")
                    }
                    state={"state" in part ? String(part.state) : "unknown"}
                    input={"input" in part ? part.input : undefined}
                    output={"output" in part ? part.output : undefined}
                    preliminary={
                      "preliminary" in part ? Boolean(part.preliminary) : false
                    }
                  />
                );
              }

              return null;
            })}
          </div>
        </div>

        <div
          className={cn(
            "opacity-0 transition-opacity group-hover:opacity-100",
            isUser ? "self-end" : "self-start",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon-xs"
                variant="ghost"
                onClick={copyText}
                aria-label="Copy message"
              >
                <CopyIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export function ChatPanel() {
  const { messages, sendMessage, status, stop, error } = useWorkspace();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    root.scrollTo({ top: root.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage(input);
    setInput("");
  }

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.97_0_0),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.22_0_0),transparent_55%)]" />

      <div className="relative flex h-full min-h-0 w-full min-w-0 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col gap-6 px-4 py-6 md:px-6">
          {messages.length === 0 ? (
            <Empty className="flex-1 justify-center border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BotIcon />
                </EmptyMedia>
                <EmptyTitle>Talk to Studio</EmptyTitle>
                <EmptyDescription>
                  Studio is the supervisor. It can list agents and invoke an
                  Active specialist. Site login, fetch, and browser tools run
                  on that agent — not in this chat.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent className="max-w-3xl">
                <div className="grid w-full gap-2 sm:grid-cols-3">
                  {starters.map((starter) => (
                    <Button
                      key={starter.title}
                      variant="outline"
                      className="h-auto flex-col items-start gap-1 whitespace-normal px-3 py-3 text-left"
                      onClick={() => sendMessage(starter.prompt)}
                    >
                      <span className="font-medium">{starter.title}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {starter.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}

          {isBusy && messages.at(-1)?.role === "user" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Spinner />
              Routing to a specialist…
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>
                {error.message ||
                  "Check OPENAI_API_KEY in .env.local and try again."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <div className="relative shrink-0 border-t border-border bg-background px-4 py-4">
        <form onSubmit={onSubmit} className="w-full">
          <InputGroup className="h-auto min-h-14 items-end rounded-2xl bg-background shadow-sm">
            <InputGroupTextarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Studio to invoke an agent…"
              disabled={status === "error"}
              rows={1}
              className="min-h-14 max-h-40 resize-none py-3.5"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit(event);
                }
              }}
            />
            <InputGroupAddon align="block-end" className="justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <KbdGroup>
                  <Kbd>↵</Kbd>
                  <span>send</span>
                </KbdGroup>
                <span className="text-border">·</span>
                <KbdGroup>
                  <Kbd>⇧</Kbd>
                  <Kbd>↵</Kbd>
                  <span>newline</span>
                </KbdGroup>
              </div>
              {isBusy ? (
                <InputGroupButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => stop()}
                >
                  <SquareIcon data-icon="inline-start" />
                  Stop
                </InputGroupButton>
              ) : (
                <InputGroupButton
                  type="submit"
                  size="sm"
                  disabled={!input.trim()}
                >
                  Send
                  <ArrowUpIcon data-icon="inline-end" />
                </InputGroupButton>
              )}
            </InputGroupAddon>
          </InputGroup>
        </form>
      </div>
      </div>
    </div>
  );
}
