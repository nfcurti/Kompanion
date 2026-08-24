import {
  generateText,
  InferAgentUIMessage,
  stepCountIs,
  tool,
  ToolLoopAgent,
  type ToolSet,
} from "ai";
import { z } from "zod";

import {
  composeAgentInstructions,
  formatAgentSkillSummaries,
  resolveAgentSkills,
} from "@/agents/compose-instructions";
import { ORCHESTRATOR_MODEL } from "@/agents/constants";
import { languageModel, modelProvider, resolvedModelId } from "@/lib/language-model";
import { createSkillWebTools } from "@/lib/skill-tools";
import { listSkills } from "@/lib/skills-registry";
import { recordUsage, recordUsageFromGenerate, recordUsageFromStep } from "@/lib/usage";
import {
  getAgent,
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
    .map((agent) => {
      const skills = resolveAgentSkills(agent);
      const skillLines =
        skills.length === 0
          ? "  Skills: none"
          : [
              "  Skills:",
              ...skills.map(
                (skill) => `    - ${skill.id}: ${skill.description}`,
              ),
            ].join("\n");

      return [
        `- ${agent.name} (${agent.id}): ${agent.status} — ${agent.description}`,
        skillLines,
      ].join("\n");
    })
    .join("\n");
}

/**
 * Orchestrator: chat-facing agent that delegates to registered specialists.
 * Specialists plug in via `registerAgent` + `createTools` when status is `active`.
 * Attached skills are injected when `invokeAgent` runs.
 */
export function createOrchestrator() {
  const active = listActiveAgents();

  return new ToolLoopAgent({
    model: languageModel(),
    onStepEnd: async (step) => {
      recordUsageFromStep({
        source: "chat.orchestrator",
        action:
          step.stepNumber === 0
            ? "Orchestrator"
            : `Orchestrator · step ${step.stepNumber + 1}`,
        step,
      });
    },
    instructions: `You are Kompanion, the orchestrator for a multi-agent platform.

Your job:
- Be the primary conversational interface for the user.
- Understand goals and break them into steps when useful.
- Prefer clarity and concise answers unless the user asks for depth.
- When specialist agents are active, delegate matching work with invokeAgent.
- Match tasks to agents using their descriptions and skill summaries (what/when).
- When no specialists are active, handle requests yourself and do not invent agents or pretend tools ran.
- Do not invent skill content — only use what invokeAgent / listAgents return.
- Skills may include site login. Try skillLogin then skillFetch for HTML. If fetch reports reachedRequestedUrl false or the site is a JS app, use skillBrowserOpen({ login: true, url }) with the task URL, then snapshot/act. Never ask for or print passwords. Credentials live on the skill.

Agent catalog:
${formatAgentCatalog()}

Active specialists: ${
      active.length === 0
        ? "none — handle requests yourself until agents are registered and active."
        : active.map((a) => a.id).join(", ")
    }

Use listAgents to inspect the fleet. Use invokeAgent to run an active specialist with its attached skills. For site skills, you may call skillLogin / skillFetch or the skillBrowser* tools directly.`,
    tools: {
      listAgents: tool({
        description:
          "List registered agents, status, and attached skill summaries for routing.",
        inputSchema: z.object({
          status: z
            .enum(["planned", "registered", "active", "disabled"])
            .optional()
            .describe("Optional filter by agent status"),
        }),
        execute: async ({ status }) => {
          const snapshot = getRegistrySnapshot();
          const filtered = status
            ? snapshot.filter((agent) => agent.status === status)
            : snapshot;

          return filtered.map((agent) => ({
            id: agent.id,
            name: agent.name,
            description: agent.description,
            status: agent.status,
            skills: resolveAgentSkills(agent).map((skill) => ({
              id: skill.id,
              description: skill.description,
            })),
            skillSummary: formatAgentSkillSummaries(agent),
            model: agent.model,
          }));
        },
      }),
      invokeAgent: tool({
        description:
          "Invoke an active specialist agent. Loads its attached skills into instructions and runs the given task. Use when a specialist's description or skills match the user goal.",
        inputSchema: z.object({
          agentId: z
            .string()
            .trim()
            .min(1)
            .describe("Id of an active agent from the catalog"),
          task: z
            .string()
            .trim()
            .min(1)
            .describe("Concrete task for the specialist to complete"),
        }),
        execute: async ({ agentId, task }) => {
          const agent = getAgent(agentId);
          if (!agent) {
            return {
              ok: false as const,
              error: `Agent not found: ${agentId}`,
            };
          }
          if (agent.status !== "active") {
            return {
              ok: false as const,
              error: `Agent ${agentId} is ${agent.status}, not active. Only active agents can be invoked.`,
            };
          }

          const skills = resolveAgentSkills(agent);
          const instructions = composeAgentInstructions(agent);
          const modelId = agent.model?.trim() || resolvedModelId();
          const model = languageModel(modelId);
          const startedAt = Date.now();

          try {
            const result = await generateText({
              model,
              instructions,
              prompt: task,
              tools: createSkillWebTools(skills),
              stopWhen: stepCountIs(16),
            });
            recordUsageFromGenerate({
              source: "chat.invoke-agent",
              action: `Invoke ${agent.id}`,
              status: "ok",
              provider: modelProvider(),
              model: modelId,
              durationMs: Date.now() - startedAt,
              agentId: agent.id,
              result,
            });

            return {
              ok: true as const,
              agentId: agent.id,
              skillsUsed: skills.map((skill) => skill.id),
              text: result.text,
            };
          } catch (error) {
            recordUsage({
              source: "chat.invoke-agent",
              action: `Invoke ${agent.id}`,
              status: "error",
              provider: modelProvider(),
              model: modelId,
              inputTokens: 0,
              outputTokens: 0,
              cachedInputTokens: 0,
              cacheWriteTokens: 0,
              reasoningTokens: 0,
              totalTokens: 0,
              durationMs: Date.now() - startedAt,
              agentId: agent.id,
              error: error instanceof Error ? error.message : "Request failed",
            });
            throw error;
          }
        },
      }),
      ...createSkillWebTools(listSkills()),
      ...buildActiveAgentTools(),
    },
  });
}

export type OrchestratorMessage = InferAgentUIMessage<
  ReturnType<typeof createOrchestrator>
>;
