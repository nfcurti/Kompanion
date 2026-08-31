import { stepCountIs, streamText } from "ai";

import {
  composeAgentRoutineInstructions,
  resolveAgentSkills,
} from "@/agents/compose-instructions";
import { getAgent } from "@/agents/registry";
import { languageModel, modelProvider, resolvedModelId } from "@/lib/language-model";
import { closeSkillBrowser } from "@/lib/skill-browser";
import { createSkillWebTools } from "@/lib/skill-tools";
import { recordUsage, recordUsageFromGenerate } from "@/lib/usage";

export type RunAgentRoutineResult = {
  ok: boolean;
  text?: string;
  error?: string;
  durationMs: number;
  agentId: string;
};

/**
 * Run one agent with every capability they have. Does not go through Studio.
 */
export async function runAgentRoutine(options: {
  agentId: string;
  prompt: string;
  abortSignal?: AbortSignal;
}): Promise<RunAgentRoutineResult> {
  const startedAt = Date.now();
  const agent = getAgent(options.agentId);

  if (!agent) {
    return {
      ok: false,
      error: `Agent not found: ${options.agentId}`,
      durationMs: Date.now() - startedAt,
      agentId: options.agentId,
    };
  }

  if (agent.status !== "active") {
    return {
      ok: false,
      error: `${agent.id} is ${agent.status}, not Active.`,
      durationMs: Date.now() - startedAt,
      agentId: agent.id,
    };
  }

  const skills = resolveAgentSkills(agent);
  if (skills.length === 0) {
    return {
      ok: false,
      error: `${agent.id} has no capabilities. Attach at least one first.`,
      durationMs: Date.now() - startedAt,
      agentId: agent.id,
    };
  }

  const usageAction = `Routine ${agent.id}`;
  const modelId = agent.model?.trim() || resolvedModelId();
  const model = languageModel(modelId);

  try {
    const result = streamText({
      model,
      instructions: composeAgentRoutineInstructions(agent),
      prompt: options.prompt,
      tools: {
        ...createSkillWebTools(skills),
        ...(agent.createTools?.() ?? {}),
      },
      stopWhen: stepCountIs(16),
      abortSignal: options.abortSignal,
    });

    const [text, finishReason, usage, steps, providerMetadata] =
      await Promise.all([
        result.text,
        result.finishReason,
        result.usage,
        result.steps,
        result.providerMetadata,
      ]);

    recordUsageFromGenerate({
      source: "routine.perform",
      action: usageAction,
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

    return {
      ok: true,
      text,
      durationMs: Date.now() - startedAt,
      agentId: agent.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Routine run failed";
    recordUsage({
      source: "routine.perform",
      action: usageAction,
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
      error: message,
    });
    return {
      ok: false,
      error: message,
      durationMs: Date.now() - startedAt,
      agentId: agent.id,
    };
  } finally {
    await Promise.all(skills.map((skill) => closeSkillBrowser(skill.id)));
  }
}
