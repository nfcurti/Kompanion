"use client";

import type { AgentManifest } from "@/agents/types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CommandMenu } from "@/components/workspace/command-menu";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import type { Skill } from "@/lib/skills";

export function AppShell({
  agents,
  skills,
  modelId,
  children,
}: {
  agents: AgentManifest[];
  skills: Skill[];
  modelId: string;
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden">
      <WorkspaceProvider agents={agents} skills={skills} modelId={modelId}>
        <AppSidebar />
        <SidebarInset className="min-h-0 overflow-hidden">
          <WorkspaceHeader />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {children}
          </div>
        </SidebarInset>
        <CommandMenu />
      </WorkspaceProvider>
    </SidebarProvider>
  );
}
