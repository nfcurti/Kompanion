"use client";

import {
  MessageSquarePlusIcon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SearchIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
  const { clearChat, inspectorOpen, setInspectorOpen } = useWorkspace();

  const navItem = findNavItem(pathname);
  const isPlayground = pathname.startsWith("/playground");
  const agentMatch = pathname.match(/^\/agents\/([^/]+)$/);
  const agentId = agentMatch?.[1] ? decodeURIComponent(agentMatch[1]) : null;

  return (
    <header className="z-10 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden min-w-0 sm:block">
        <BreadcrumbList>
          {agentId ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/agents">{navItem?.title ?? "Agents"}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-mono">{agentId}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>{navItem?.title ?? "Workspace"}</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-1.5">
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
                  aria-label="Clear Studio"
                >
                  <MessageSquarePlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear Studio</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setInspectorOpen(!inspectorOpen)}
                  aria-label="Toggle activity panel"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={inspectorOpen ? "close" : "open"}
                      initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      exit={{ opacity: 0, scale: 0.85, rotate: 8 }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex"
                    >
                      {inspectorOpen ? (
                        <PanelRightCloseIcon />
                      ) : (
                        <PanelRightOpenIcon />
                      )}
                    </motion.span>
                  </AnimatePresence>
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
