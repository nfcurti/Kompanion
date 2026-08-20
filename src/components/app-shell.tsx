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
  children,
}: {
  agents: AgentManifest[];
  skills: Skill[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <WorkspaceProvider agents={agents} skills={skills}>
        <AppSidebar />
        <SidebarInset className="overflow-hidden">
          <WorkspaceHeader />
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </SidebarInset>
        <CommandMenu />
      </WorkspaceProvider>
    </SidebarProvider>
  );
}
