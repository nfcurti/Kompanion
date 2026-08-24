import { AgentDetail } from "@/components/agents/agent-detail";

export default async function AgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AgentDetail agentId={id} />;
}
