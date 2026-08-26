import {
  InferAgentUIMessage,
  stepCountIs,
  streamText,
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
import { closeSkillBrowser } from "@/lib/skill-browser";
import { recordUsage, recordUsageFromGenerate, recordUsageFromStep } from "@/lib/usage";
import {
  getAgent,
  getRegistrySnapshot,
  listActiveAgents,
  listAgents,
} from "@/agents/registry";
import type { RegisteredAgent } from "@/agents/types";

export { ORCHESTRATOR_MODEL };

function shortUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    const compact = `${parsed.host}${path}`;
    return compact.length > 48 ? `${compact.slice(0, 45)}…` : compact;
  } catch {
    return url.length > 48 ? `${url.slice(0, 45)}…` : url;
  }
}

function describeSpecialistStep(toolName: string, input: unknown): string {
  const rec =
    input && typeof input === "object"
      ? (input as Record<string, unknown>)
      : {};
  const url = typeof rec.url === "string" ? rec.url : null;
  const value = typeof rec.value === "string" ? rec.value : null;

  switch (toolName) {
    case "skillLogin":
      return "Signing in…";
    case "skillFetch":
      return url ? `Reading ${shortUrl(url)}…` : "Reading a page…";
    case "skillBrowserOpen":
      return rec.login ? "Opening the site and signing in…" : "Opening the site…";
    case "skillBrowserAct":
      if (rec.action === "click") return "Clicking through the page…";
      if (rec.action === "goto") {
        return value ? `Going to ${shortUrl(value)}…` : "Navigating…";
      }
      if (rec.action === "fill") return "Filling a form…";
      if (rec.action === "press") return "Pressing a key…";
      return "Acting on the page…";
    case "skillBrowserSnapshot":
      return "Reading the page…";
    case "skillBrowserClose":
      return "Closing the browser…";
    default:
      return "Working…";
  }
}

type InvokeAgentOutput = {
  ok: boolean;
  complete?: boolean;
  step?: string;
  error?: string;
  agentId?: string;
  agentName?: string;
  skillsUsed?: string[];
  text?: string;
};

function toolsForSpecialist(agent: RegisteredAgent): ToolSet {
  return {
    ...createSkillWebTools(resolveAgentSkills(agent)),
    ...(agent.createTools?.() ?? {}),
  };
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
          ? "  Capabilities: none"
          : [
              "  Capabilities:",
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
 * Orchestrator: chat-facing supervisor. It only lists and invokes specialists.
 * Each specialist gets a closed tool set: attached skill tools plus optional createTools.
 */
export function createOrchestrator() {
  const active = listActiveAgents();
  const runId = crypto.randomUUID();

  return new ToolLoopAgent({
    model: languageModel(),
    onStepEnd: async (step) => {
      recordUsageFromStep({
        source: "chat.orchestrator",
        action: "Orchestrator",
        runId,
        step,
      });
    },
    instructions: `You are Kompanion, the assistant in Studio.

Your job:
- Be the primary conversational interface for the user.
- Understand goals and break them into steps when useful.
- Prefer clarity and concise answers unless the user asks for depth.
- Speak in user language: agents, capabilities, routines, Studio. Never say orchestrator, skills, invoke, or fleet.
- You have no site, login, fetch, or browser tools. Never pretend to browse, scrape, or run a capability yourself.
- When agents are active, delegate matching work with invokeAgent. Match on descriptions and capability summaries.
- If no Active agent matches, say so and point the user to Agents. Do not invent agents, capabilities, or results.
- Do not invent capability content — only use what invokeAgent / listAgents return.

Agent catalog:
${formatAgentCatalog()}

Active agents: ${
      active.length === 0
        ? "none — you can chat, but you cannot run capabilities until an agent is Active."
        : active.map((a) => a.id).join(", ")
    }

Use listAgents to see the team. Use invokeAgent to ask an Active agent to work. That agent uses its attached capabilities.`,
    tools: {
      listAgents: tool({
        description:
          "List agents, status, and attached capability summaries.",
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
          "Ask an Active agent to work. The agent only gets its attached capabilities. Use when the agent's description or capabilities match the user goal.",
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
            .describe("What the agent should do"),
        }),
        execute: async function* (
          { agentId, task },
          { abortSignal },
        ): AsyncGenerator<InvokeAgentOutput> {
          const agent = getAgent(agentId);
          if (!agent) {
            yield {
              ok: false,
              complete: true,
              step: "Agent not found",
              error: `Agent not found: ${agentId}`,
            };
            return;
          }
          if (agent.status !== "active") {
            yield {
              ok: false,
              complete: true,
              step: `${agent.name} is not active`,
              agentId: agent.id,
              agentName: agent.name,
              error: `Agent ${agentId} is ${agent.status}, not Active. Only Active agents can be asked to work.`,
            };
            return;
          }

          const skills = resolveAgentSkills(agent);
          const instructions = composeAgentInstructions(agent);
          const modelId = agent.model?.trim() || resolvedModelId();
          const model = languageModel(modelId);
          const startedAt = Date.now();

          const result = streamText({
            model,
            instructions,
            prompt: task,
            tools: toolsForSpecialist(agent),
            stopWhen: stepCountIs(16),
            abortSignal,
          });

          try {
            let writing = false;
            for await (const part of result.fullStream) {
              if (part.type === "tool-call") {
                yield {
                  ok: true,
                  agentId: agent.id,
                  agentName: agent.name,
                  step: describeSpecialistStep(part.toolName, part.input),
                };
                continue;
              }
              if (part.type === "text-delta" && !writing) {
                writing = true;
                yield {
                  ok: true,
                  agentId: agent.id,
                  agentName: agent.name,
                  step: "Writing the result…",
                };
              }
            }

            const [text, finishReason, usage, steps, providerMetadata] =
              await Promise.all([
                result.text,
                result.finishReason,
                result.usage,
                result.steps,
                result.providerMetadata,
              ]);

            recordUsageFromGenerate({
              source: "chat.invoke-agent",
              action: `Invoke ${agent.id}`,
              status: "ok",
              provider: modelProvider(),
              model: modelId,
              durationMs: Date.now() - startedAt,
              agentId: agent.id,
              result: {
                text,
                finishReason,
                usage,
                steps,
                providerMetadata,
              },
            });

            yield {
              ok: true,
              complete: true,
              agentId: agent.id,
              agentName: agent.name,
              skillsUsed: skills.map((skill) => skill.id),
              text,
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
          } finally {
            await Promise.all(skills.map((skill) => closeSkillBrowser(skill.id)));
          }
        },
      }),
    },
  });
}

export type OrchestratorMessage = InferAgentUIMessage<
  ReturnType<typeof createOrchestrator>
>;
