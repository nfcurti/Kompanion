import { createOpenAI } from "@ai-sdk/openai";

import { getResolvedModelId } from "@/lib/settings-store";

export function modelProvider() {
  return "openai" as const;
}

function toOpenAIModelId(modelId: string) {
  return modelId.startsWith("openai/")
    ? modelId.slice("openai/".length)
    : modelId;
}

export function resolvedModelId(modelId?: string) {
  return modelId?.trim() || getResolvedModelId();
}

/** Resolve a model id through the OpenAI API. */
export function languageModel(modelId?: string) {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is missing. Add it to .env.local and restart the dev server.",
    );
  }

  return createOpenAI({ apiKey }).chat(toOpenAIModelId(resolvedModelId(modelId)));
}
