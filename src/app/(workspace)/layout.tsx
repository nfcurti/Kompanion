import { listAgents } from "@/agents/registry";
import { AppShell } from "@/components/app-shell";

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

  return <AppShell agents={agents}>{children}</AppShell>;
}
