import { listAgents } from "@/agents/registry";
import { AppShell } from "@/components/app-shell";
import { getResolvedModelId } from "@/lib/settings-store";
import { listSkills } from "@/lib/skills-registry";

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const agents = listAgents().map(
    ({ id, name, description, status, capabilities, model }) => ({
      id,
      name,
      description,
      status,
      capabilities,
      model,
    }),
  );
  const skills = listSkills();
  const modelId = getResolvedModelId();

  return (
    <AppShell agents={agents} skills={skills} modelId={modelId}>
      {children}
    </AppShell>
  );
}
