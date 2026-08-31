"use client";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import type { AgentManifest } from "@/agents/types";
import { PageTransition } from "@/components/motion/page-transition";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/workspace/app-sidebar";
import { CommandMenu } from "@/components/workspace/command-menu";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import { RoutineCadenceTicker } from "@/components/routines/routine-cadence-ticker";
import { StudioInboxBridge } from "@/components/studio/studio-inbox-bridge";
import type { Skill } from "@/lib/skills";

export function AppShell({
  agents,
  skills,
  modelId,
  chatMessages,
  children,
}: {
  agents: AgentManifest[];
  skills: Skill[];
  modelId: string;
  chatMessages: OrchestratorMessage[];
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen className="h-svh overflow-hidden">
      <WorkspaceProvider
        agents={agents}
        skills={skills}
        modelId={modelId}
        chatMessages={chatMessages}
      >
        <AppSidebar />
        <SidebarInset className="min-h-0 overflow-hidden">
          <WorkspaceHeader />
          <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <PageTransition>{children}</PageTransition>
          </div>
        </SidebarInset>
        <CommandMenu />
        <RoutineCadenceTicker />
        <StudioInboxBridge />
      </WorkspaceProvider>
    </SidebarProvider>
  );
}
