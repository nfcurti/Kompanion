"use client";

import {
  MessageSquarePlusIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SearchIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import { ORCHESTRATOR_MODEL } from "@/agents/orchestrator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { findNavItem } from "@/lib/navigation";

export function WorkspaceHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    status,
    clearChat,
    inspectorOpen,
    setInspectorOpen,
    messages,
  } = useWorkspace();

  const navItem = findNavItem(pathname);
  const isPlayground = pathname.startsWith("/playground");
  const busy = status === "submitted" || status === "streaming";

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-3">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden min-w-0 sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-muted-foreground">
              Kompanion
            </BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{navItem?.title ?? "Workspace"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
        {isPlayground && (
          <>
            <Badge
              variant={busy ? "default" : "secondary"}
              className="hidden md:inline-flex"
            >
              {busy ? "Running" : "Ready"}
            </Badge>
            <Badge
              variant="outline"
              className="hidden font-mono text-[10px] lg:inline-flex"
            >
              {ORCHESTRATOR_MODEL}
            </Badge>
            <Badge variant="outline" className="hidden sm:inline-flex">
              {messages.length} msgs
            </Badge>
          </>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={() =>
                window.dispatchEvent(new Event("kompanion:command"))
              }
            >
              <SearchIcon data-icon="inline-start" />
              Search
              <Kbd className="ml-1">⌘K</Kbd>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Open command palette</TooltipContent>
        </Tooltip>

        {isPlayground && (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    clearChat();
                    router.push("/playground");
                  }}
                  aria-label="New session"
                >
                  <MessageSquarePlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>New session</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setInspectorOpen(!inspectorOpen)}
                  aria-label="Toggle activity panel"
                >
                  {inspectorOpen ? (
                    <PanelRightCloseIcon />
                  ) : (
                    <PanelRightOpenIcon />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {inspectorOpen ? "Hide activity" : "Show activity"}
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}
