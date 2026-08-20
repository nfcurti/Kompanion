"use client";

import {
  BotIcon,
  MessageSquarePlusIcon,
  MoonIcon,
  PanelRightIcon,
  SunIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { agentIcon, statusMeta } from "@/components/agents/agent-meta";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { mainNav } from "@/lib/navigation";

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { setTheme } = useTheme();
  const router = useRouter();
  const {
    agents,
    sendMessage,
    clearChat,
    setInspectorOpen,
    setSelectedAgentId,
  } = useWorkspace();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("kompanion:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("kompanion:command", onOpen);
    };
  }, []);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function run(prompt: string) {
    setOpen(false);
    router.push("/playground");
    window.setTimeout(() => sendMessage(prompt), 50);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command>
        <CommandInput placeholder="Search pages and agents…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            {mainNav.flatMap((group) =>
              group.items.map((item) => (
                <CommandItem
                  key={item.href}
                  value={`${item.title} ${item.description}`}
                  onSelect={() => go(item.href)}
                >
                  <item.icon />
                  {item.title}
                </CommandItem>
              )),
            )}
          </CommandGroup>

          {agents.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Agents">
                {agents.map((agent) => {
                  const Icon = agentIcon(agent.capabilities);
                  return (
                    <CommandItem
                      key={agent.id}
                      value={`${agent.id}`}
                      onSelect={() => {
                        setSelectedAgentId(agent.id);
                        go(`/agents?focus=${agent.id}`);
                      }}
                    >
                      <Icon />
                      <span className="flex-1 font-mono">{agent.id}</span>
                      <span className="text-xs text-muted-foreground">
                        {statusMeta[agent.status].label}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Actions">
            <CommandItem
              onSelect={() => {
                clearChat();
                go("/playground");
              }}
            >
              <MessageSquarePlusIcon />
              New Studio session
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setInspectorOpen(true);
                go("/playground");
              }}
            >
              <PanelRightIcon />
              Open activity inspector
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme("light");
                setOpen(false);
              }}
            >
              <SunIcon />
              Light theme
            </CommandItem>
            <CommandItem
              onSelect={() => {
                setTheme("dark");
                setOpen(false);
              }}
            >
              <MoonIcon />
              Dark theme
            </CommandItem>
            <CommandItem
              onSelect={() => {
                run("What can you do right now?");
              }}
            >
              <BotIcon />
              Ask orchestrator capabilities
              <CommandShortcut>⌘K</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
