import { APICallError, stepCountIs, streamText } from "ai";
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

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Failed to test skill.";
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

  let prompt: string;
  try {
    const body = await request.json();
    prompt = testSkillSchema.parse(body).prompt;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Add a test prompt first.", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      send({ type: "status", message: "Waiting on the model…" });

      try {
        const result = streamText({
          model: languageModel(modelId),
          instructions: composeSkillTestInstructions(skill),
          prompt,
          tools: createSkillWebTools([skill]),
          stopWhen: stepCountIs(16),
          abortSignal: request.signal,
        });

        for await (const part of result.fullStream) {
          if (part.type === "start-step") {
            send({ type: "status", message: "Model step in progress…" });
            continue;
          }
          if (part.type === "tool-call") {
            send({
              type: "tool-start",
              id: part.toolCallId,
              name: part.toolName,
              input: compactValue(part.input),
            });
            send({
              type: "status",
              message: `Running ${part.toolName}…`,
            });
            continue;
          }
          if (part.type === "tool-result") {
            send({
              type: "tool-end",
              id: part.toolCallId,
              output: compactValue(part.output),
            });
            continue;
          }
          if (part.type === "tool-error") {
            send({
              type: "tool-end",
              id: part.toolCallId,
              output: compactValue({
                ok: false,
                error: errorMessage(part.error),
              }),
            });
            continue;
          }
          if (part.type === "text-delta") {
            send({ type: "text-delta", text: part.text });
            continue;
          }
          if (part.type === "error") {
            send({ type: "error", error: errorMessage(part.error) });
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
          source: "skills.test",
          action: `Test skill · ${skill.id}`,
          status: "ok",
          provider: modelProvider(),
          model: modelId,
          durationMs: Date.now() - startedAt,
          result: {
            text,
            finishReason,
            usage,
            steps,
            providerMetadata,
          },
        });

        send({
          type: "finish",
          finishReason,
          durationMs: Date.now() - startedAt,
        });
      } catch (error) {
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
          error: errorMessage(error),
        });
        console.error("skill test failed", error);
        const message = APICallError.isInstance(error)
          ? error.message
          : errorMessage(error);
        send({ type: "error", error: message });
      } finally {
        await closeSkillBrowser(skill.id);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
