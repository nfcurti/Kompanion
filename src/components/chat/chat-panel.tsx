"use client";

import {
  ArrowUpIcon,
  BotIcon,
  CircleAlertIcon,
  CopyIcon,
  SquareIcon,
  UserIcon,
  WrenchIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { cn } from "@/lib/utils";

const starters = [
  {
    title: "What can you do?",
    description: "Ask the orchestrator about its current capabilities",
    prompt: "What can you do right now, and how will agents plug in later?",
  },
  {
    title: "List agents",
    description: "Inspect the live registry via the listAgents tool",
    prompt: "What agents are registered right now?",
  },
  {
    title: "Start a task",
    description: "Give the orchestrator something concrete to work on",
    prompt: "Help me break down a task into clear steps.",
  },
];

function ToolCallCard({
  name,
  state,
  input,
  output,
}: {
  name: string;
  state: string;
  input?: unknown;
  output?: unknown;
}) {
  const done = state === "output-available";

  return (
    <Collapsible
      defaultOpen={!done}
      className="overflow-hidden rounded-xl border border-border bg-background/60"
    >
      <CollapsibleTrigger className="hover:cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs">
        <WrenchIcon />
        <span className="font-mono font-medium">{name}</span>
        <Badge variant={done ? "secondary" : "outline"} className="ml-auto">
          {done ? "done" : state}
        </Badge>
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
        "group flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="mt-0.5 size-8">
        <AvatarFallback className="bg-muted">
          {isUser ? <UserIcon /> : <BotIcon />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex min-w-0 max-w-[min(100%,42rem)] flex-col gap-2",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">
            {isUser ? "You" : "Orchestrator"}
          </span>
          {!isUser && (
            <Badge variant="outline" className="font-mono text-[10px]">
              gpt-5.5
            </Badge>
          )}
        </div>

        <div
          className={cn(
            "w-full rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground ring-1 ring-foreground/10",
          )}
        >
          <div className="flex flex-col gap-3">
            {message.parts.map((part, index) => {
              if (part.type === "text" && part.text) {
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
                    name={part.type.replace(/^tool-/, "")}
                    state={"state" in part ? String(part.state) : "unknown"}
                    input={"input" in part ? part.input : undefined}
                    output={"output" in part ? part.output : undefined}
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage(input);
    setInput("");
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.97_0_0),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top,oklch(0.22_0_0),transparent_55%)]" />

      <ScrollArea className="relative min-h-0 flex-1">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
          {messages.length === 0 ? (
            <Empty className="min-h-[52vh] border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BotIcon />
                </EmptyMedia>
                <EmptyTitle>Orchestrate from chat</EmptyTitle>
                <EmptyDescription>
                  Kompanion is your control plane. Ask questions, inspect the
                  fleet, and later delegate to specialist agents as you deploy
                  them.
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
              Orchestrator is planning the next step…
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>
                {error.message ||
                  "Check AI_GATEWAY_API_KEY in .env.local and try again."}
              </AlertDescription>
            </Alert>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="relative border-t border-border bg-background/90 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/75">
        <form onSubmit={onSubmit} className="mx-auto w-full max-w-3xl">
          <InputGroup className="h-auto min-h-14 items-end rounded-2xl bg-background shadow-sm">
            <InputGroupTextarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message the orchestrator…"
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
  );
}
