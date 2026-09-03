"use client";

import {
  ArrowUpIcon,
  ChevronDownIcon,
  CircleAlertIcon,
  CopyIcon,
  SquareIcon,
  WrenchIcon,
} from "lucide-react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import { statusMeta } from "@/components/agents/agent-meta";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
import { LocalTime } from "@/components/local-time";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { StudioMessageMeta } from "@/lib/studio-inbox";
import { speakerLabel } from "@/lib/studio-inbox";
import {
  formatStartedAgo,
  isSupervisorToolDone,
  looksLikeMarkdown,
  supervisorToolBadge,
  supervisorToolLabel,
} from "@/lib/tool-ui-labels";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

function looksLikeJsonBlob(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

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
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease }}
    >
      <Collapsible
        defaultOpen={false}
        className="group overflow-hidden rounded-xl border border-border bg-background/60"
      >
        <CollapsibleTrigger className="hover:cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left text-xs">
          <WrenchIcon />
          <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
          {done ? null : (
            <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
              {formatStartedAgo(elapsedMs)}
            </span>
          )}
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
    </motion.div>
  );
}

function MessageParts({
  message,
  isUser,
}: {
  message: OrchestratorMessage;
  isUser: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {message.parts.map((part, index) => {
        if (part.type === "text" && part.text) {
          const hasToolPart = message.parts.some((item) =>
            item.type.startsWith("tool-"),
          );
          if (hasToolPart && looksLikeJsonBlob(part.text)) {
            return null;
          }
          const streaming = "state" in part && part.state === "streaming";
          if (!isUser && !streaming && looksLikeMarkdown(part.text)) {
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
              {streaming ? (
                <span
                  aria-hidden
                  className="ml-0.5 inline-block h-[1em] w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-foreground/70 align-baseline"
                />
              ) : null}
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
  );
}

function MessageBubble({
  message,
  animateEntrance,
}: {
  message: OrchestratorMessage;
  animateEntrance: boolean;
}) {
  const isUser = message.role === "user";
  const reduceMotion = useReducedMotion();
  const meta = (message.metadata as StudioMessageMeta | undefined) ?? null;
  const createdAt = meta?.createdAt;

  async function copyText() {
    const text = message.parts
      .filter((part) => part.type === "text")
      .map((part) => ("text" in part ? part.text : ""))
      .join("\n");
    if (!text) return;
    await navigator.clipboard.writeText(text);
    toast.success("Copied message");
  }

  const bubble = (
    <motion.div
      layout
      className={cn(
        "w-full min-w-0 overflow-hidden rounded-2xl px-4 py-3",
        isUser
          ? "bg-primary text-primary-foreground"
          : "bg-card text-card-foreground ring-1 ring-foreground/10",
      )}
    >
      <MessageParts message={message} isUser={isUser} />
    </motion.div>
  );

  return (
    <motion.div
      layout
      initial={
        reduceMotion || !animateEntrance ? false : { opacity: 0, y: 12 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease }}
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
            {isUser ? "You" : speakerLabel(meta)}
          </span>
        </div>

        {createdAt ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full min-w-0">{bubble}</div>
            </TooltipTrigger>
            <TooltipContent side={isUser ? "left" : "right"}>
              <LocalTime value={createdAt} withSeconds />
            </TooltipContent>
          </Tooltip>
        ) : (
          bubble
        )}

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
    </motion.div>
  );
}

function StudioComposer({
  input,
  onInputChange,
  onSubmit,
  isBusy,
  errorDisabled,
  stop,
  placeholder,
  autoFocus,
  submitLabel,
}: {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  isBusy: boolean;
  errorDisabled: boolean;
  stop: () => void;
  placeholder: string;
  autoFocus?: boolean;
  submitLabel: string;
}) {
  return (
    <form onSubmit={onSubmit} className="w-full">
      <InputGroup className="h-auto min-h-14 items-end rounded-2xl bg-background shadow-sm transition-shadow focus-within:shadow-md">
        <InputGroupTextarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          placeholder={placeholder}
          disabled={errorDisabled}
          autoFocus={autoFocus}
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
          <AnimatePresence mode="wait" initial={false}>
            {isBusy ? (
              <motion.div
                key="stop"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15, ease }}
              >
                <InputGroupButton
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => stop()}
                >
                  <SquareIcon data-icon="inline-start" />
                  Stop
                </InputGroupButton>
              </motion.div>
            ) : (
              <motion.div
                key="send"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.15, ease }}
              >
                <InputGroupButton
                  type="submit"
                  size="sm"
                  disabled={!input.trim()}
                >
                  {submitLabel}
                  <ArrowUpIcon data-icon="inline-end" />
                </InputGroupButton>
              </motion.div>
            )}
          </AnimatePresence>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}

export function ChatPanel() {
  const { agents, messages, sendMessage, status, stop, error } = useWorkspace();
  const [input, setInput] = useState("");
  const [allowEntrance, setAllowEntrance] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedAtBottom = useRef(false);
  const reduceMotion = useReducedMotion();
  const isBusy = status === "submitted" || status === "streaming";
  const empty = messages.length === 0;
  const onDuty = agents.filter((agent) => agent.status === "active");
  const streamingText =
    status === "streaming"
      ? messages
          .at(-1)
          ?.parts.some(
            (part) =>
              part.type === "text" &&
              "state" in part &&
              part.state === "streaming",
          )
      : false;

  useLayoutEffect(() => {
    const root = scrollRef.current;
    if (!root || empty) return;
    const instant = !openedAtBottom.current;
    root.scrollTo({
      top: root.scrollHeight,
      behavior: instant ? "auto" : "smooth",
    });
    openedAtBottom.current = true;
    if (!allowEntrance) setAllowEntrance(true);
  }, [allowEntrance, empty, messages, status]);

  useEffect(() => {
    if (!streamingText) return;
    const root = scrollRef.current;
    if (!root) return;
    const id = window.setInterval(() => {
      root.scrollTo({ top: root.scrollHeight, behavior: "auto" });
    }, 120);
    return () => window.clearInterval(id);
  }, [streamingText]);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim() || isBusy) return;
    sendMessage(input);
    setInput("");
  }

  const composer = (
    <StudioComposer
      input={input}
      onInputChange={setInput}
      onSubmit={onSubmit}
      isBusy={isBusy}
      errorDisabled={status === "error"}
      stop={stop}
      placeholder="Ask Studio…"
      autoFocus
      submitLabel="Send"
    />
  );

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-2">
        <p className="shrink-0 text-xs text-muted-foreground">On duty</p>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {onDuty.length === 0 ? (
            <span className="text-xs text-muted-foreground">
              Nobody Active
            </span>
          ) : (
            onDuty.map((agent) => (
              <Badge key={agent.id} variant={statusMeta.active.badge}>
                {agent.name || agent.id}
              </Badge>
            ))
          )}
        </div>
        <Button variant="link" size="xs" className="h-auto shrink-0 px-0" asChild>
          <Link href="/agents">Agents</Link>
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={cn(
            "mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-6 md:px-6",
            !empty && "justify-end",
          )}
        >
          <LayoutGroup>
            <AnimatePresence mode="popLayout" initial={false}>
              {empty ? (
                <motion.p
                  key="empty"
                  className="m-auto max-w-sm text-center text-sm text-muted-foreground"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Waiting on the floor. Assign work, run a capability, or let a
                  routine tick. It shows up here.
                </motion.p>
              ) : (
                messages.map((message) => {
                  const hidden = Boolean(
                    (message.metadata as StudioMessageMeta | undefined)
                      ?.hidden,
                  );
                  if (hidden) return null;
                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      animateEntrance={allowEntrance}
                    />
                  );
                })
              )}
            </AnimatePresence>
          </LayoutGroup>

          <AnimatePresence>
            {isBusy && messages.at(-1)?.role === "user" ? (
              <motion.div
                key="routing"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2, ease }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Spinner />
                {(messages.at(-1)?.metadata as StudioMessageMeta | undefined)
                  ?.hidden
                  ? "Writing an update…"
                  : "Finding the right agent…"}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {error && (
            <Alert variant="destructive">
              <CircleAlertIcon />
              <AlertTitle>Request failed</AlertTitle>
              <AlertDescription>
                {error.message ||
                  "Add OPENAI_API_KEY to .env.local and try again."}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease, delay: 0.05 }}
        className="relative shrink-0 border-t border-border bg-background px-4 py-4"
      >
        {composer}
      </motion.div>
    </div>
  );
}
