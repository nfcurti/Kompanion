import type { OrchestratorMessage } from "@/agents/orchestrator";
import { listAgents } from "@/agents/registry";
import { AppShell } from "@/components/app-shell";
import { listStudioChat } from "@/lib/studio-chat-store";
import { getResolvedModelId } from "@/lib/settings-store";
import { listSkills } from "@/lib/skills-registry";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agents = listAgents().map(
    ({ id, name, description, behavior, status, capabilities, model }) => ({
      id,
      name,
      description,
      behavior,
      status,
      capabilities,
      model,
    }),
  );
  const skills = listSkills();
  const modelId = getResolvedModelId();
  const chatMessages = listStudioChat();

  return (
    <AppShell
      agents={agents}
      skills={skills}
      modelId={modelId}
      chatMessages={chatMessages as OrchestratorMessage[]}
    >
      {children}
    </AppShell>
  );
}
