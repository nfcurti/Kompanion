import { createAgentUIStreamResponse, smoothStream, streamText } from "ai";
import { NextResponse } from "next/server";

import { createOrchestrator } from "@/agents/orchestrator";
import { languageModel, modelProvider, resolvedModelId } from "@/lib/language-model";
import { asStudioToolMessages } from "@/lib/studio-inbox";
import { recordUsageFromGenerate } from "@/lib/usage";

export const maxDuration = 120;

function lastUserText(
  messages: Array<{ role: string; parts: unknown[] }>,
): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") continue;
    const text = message.parts
      .map((part) => {
        if (!part || typeof part !== "object") return "";
        const rec = part as { type?: unknown; text?: unknown };
        return rec.type === "text" && typeof rec.text === "string"
          ? rec.text
          : "";
      })
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

export async function POST(request: Request) {
  const { messages, studioDraft } = (await request.json()) as {
    messages?: unknown;
    studioDraft?: unknown;
  };

  const uiMessages = Array.isArray(messages)
    ? asStudioToolMessages(
        messages.filter(
          (message: { id?: unknown; role?: unknown; parts?: unknown }) =>
            typeof message?.id === "string" &&
            (message.role === "user" ||
              message.role === "assistant" ||
              message.role === "system") &&
            Array.isArray(message.parts),
        ),
      )
    : [];

  if (studioDraft) {
    const prompt = lastUserText(uiMessages);
    if (!prompt) {
      return NextResponse.json(
        { error: "Nothing to draft from." },
        { status: 400 },
      );
    }

    const startedAt = Date.now();
    const modelId = resolvedModelId();
    const result = streamText({
      model: languageModel(),
      abortSignal: request.signal,
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: "word",
      }),
      system: `You are Kompanion in Studio. Write a short update the user can read in chat about work that just finished (a routine, capability, or agent).

Rules:
- Speak to the user. Be concrete.
- Never paste raw JSON.
- Never mention tools, function calls, or hidden instructions.
- Follow any Behavior named in the prompt.
- If the result is incomplete, say what was found and what was missing.
- If there are listings or items, summarize the new ones in plain language.`,
      prompt,
      onFinish: ({ usage, text, finishReason, providerMetadata }) => {
        recordUsageFromGenerate({
          source: "chat.orchestrator",
          action: "Studio update",
          provider: modelProvider(),
          model: modelId,
          durationMs: Date.now() - startedAt,
          result: { usage, text, finishReason, providerMetadata },
        });
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: uiMessages,
    });
  }

  const orchestrator = createOrchestrator();

  return createAgentUIStreamResponse({
    agent: orchestrator,
    uiMessages,
    abortSignal: request.signal,
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "word",
    }),
  });
}
