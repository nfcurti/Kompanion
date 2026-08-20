import { listAgents } from "@/agents/registry";
import { AppShell } from "@/components/app-shell";
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

  return (
    <AppShell agents={agents} skills={skills}>
      {children}
    </AppShell>
  );
}
