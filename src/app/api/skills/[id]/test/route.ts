import { APICallError, generateText, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { composeSkillTestInstructions } from "@/agents/compose-instructions";
import { languageModel, modelProvider, resolvedModelId } from "@/lib/language-model";
import { getSkill } from "@/lib/skills-registry";
import { closeSkillBrowser } from "@/lib/skill-browser";
import { createSkillWebTools } from "@/lib/skill-tools";
import { recordUsage, recordUsageFromGenerate } from "@/lib/usage";

export const maxDuration = 120;

const MAX_BODY_CHARS = 4_000;

const testSkillSchema = z.object({
  prompt: z.string().trim().min(1).max(4_000),
});

function compactValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.length > MAX_BODY_CHARS
      ? `${value.slice(0, MAX_BODY_CHARS)}\n…truncated`
      : value;
  }
  if (Array.isArray(value)) {
    return value.map(compactValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, nested]) => [key, compactValue(nested)],
    );
    return Object.fromEntries(entries);
  }
  return value;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const startedAt = Date.now();
  const { id } = await context.params;
  const skill = getSkill(id);
  const modelId = resolvedModelId();

  if (!skill) {
    return NextResponse.json({ error: `Skill not found: ${id}` }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { prompt } = testSkillSchema.parse(body);

    const result = await generateText({
      model: languageModel(modelId),
      instructions: composeSkillTestInstructions(skill),
      prompt,
      tools: createSkillWebTools([skill]),
      stopWhen: stepCountIs(16),
      abortSignal: request.signal,
    });

    recordUsageFromGenerate({
      source: "skills.test",
      action: `Test skill · ${skill.id}`,
      status: "ok",
      provider: modelProvider(),
      model: modelId,
      durationMs: Date.now() - startedAt,
      result,
    });

    const steps = result.steps.map((step) => ({
      stepNumber: step.stepNumber,
      text: step.text,
      tools: step.toolCalls.map((call, index) => {
        const toolResult = step.toolResults[index] as
          | { output?: unknown; result?: unknown }
          | undefined;
        const input =
          "input" in call
            ? (call as { input?: unknown }).input
            : (call as { args?: unknown }).args;
        const output = toolResult?.output ?? toolResult?.result;
        return {
          name: call.toolName,
          input: compactValue(input),
          output: compactValue(output),
        };
      }),
    }));

    return NextResponse.json({
      text: result.text,
      finishReason: result.finishReason,
      durationMs: Date.now() - startedAt,
      steps,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Add a test prompt first.", details: error.flatten() },
        { status: 400 },
      );
    }
    recordUsage({
      source: "skills.test",
      action: `Test skill · ${skill.id}`,
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
      error: error instanceof Error ? error.message : "Request failed",
    });
    console.error("skill test failed", error);
    if (APICallError.isInstance(error)) {
      const status =
        error.statusCode && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to test skill." },
      { status: 500 },
    );
  } finally {
    await closeSkillBrowser(skill.id);
  }
}
