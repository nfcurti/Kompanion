import { InferAgentUIMessage, tool, ToolLoopAgent, type ToolSet } from "ai";
import { z } from "zod";

import { ORCHESTRATOR_MODEL } from "@/agents/constants";
import {
  getRegistrySnapshot,
  listActiveAgents,
  listAgents,
} from "@/agents/registry";

export { ORCHESTRATOR_MODEL };
function buildActiveAgentTools(): ToolSet {
  const tools: ToolSet = {};

  for (const agent of listActiveAgents()) {
    if (!agent.createTools) continue;
    Object.assign(tools, agent.createTools());
  }

  return tools;
}

function formatAgentCatalog(): string {
  const agents = listAgents();
  if (agents.length === 0) {
    return "No agents registered yet.";
  }

  return agents
    .map(
      (agent) =>
        `- ${agent.name} (${agent.id}): ${agent.status} — ${agent.description}`,
    )
    .join("\n");
}

/**
 * Orchestrator: chat-facing agent that delegates to registered specialists.
 * Specialists plug in via `registerAgent` + `createTools` when status is `active`.
 */
export function createOrchestrator() {
  const active = listActiveAgents();

  return new ToolLoopAgent({
    model: ORCHESTRATOR_MODEL,
    instructions: `You are Kompanion, the orchestrator for a multi-agent platform.

Your job:
- Be the primary conversational interface for the user.
- Understand goals and break them into steps when useful.
- Prefer clarity and concise answers unless the user asks for depth.
- When specialist agents are active, delegate work that matches their capabilities.
- When no specialists are active, handle requests yourself and do not invent agents or pretend tools ran.

Agent catalog:
${formatAgentCatalog()}

Active specialists: ${
      active.length === 0
        ? "none — handle requests yourself until agents are registered and active."
        : active.map((a) => a.id).join(", ")
    }

Use the listAgents tool when the user asks what agents exist or their status.`,
    tools: {
      listAgents: tool({
        description:
          "List registered agents and their deployment status (planned, registered, active, disabled).",
        inputSchema: z.object({
          status: z
            .enum(["planned", "registered", "active", "disabled"])
            .optional()
            .describe("Optional filter by agent status"),
        }),
        execute: async ({ status }) => {
          const snapshot = getRegistrySnapshot();
          return status
            ? snapshot.filter((agent) => agent.status === status)
            : snapshot;
        },
      }),
      ...buildActiveAgentTools(),
    },
  });
}

export type OrchestratorMessage = InferAgentUIMessage<
  ReturnType<typeof createOrchestrator>
>;
