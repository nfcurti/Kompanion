"use client";

import type { AgentManifest } from "@/agents/types";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CommandMenu } from "@/components/workspace/command-menu";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceProvider } from "@/components/workspace/workspace-provider";

export function AppShell({
  agents,
  children,
}: {
  agents: AgentManifest[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <WorkspaceProvider agents={agents}>
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
