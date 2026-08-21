import { createOpenRouter } from "@openrouter/ai-sdk-provider";

import { ORCHESTRATOR_MODEL } from "@/agents/constants";

function getOpenRouter() {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is missing. Add it to .env.local and restart the dev server.",
    );
  }

  return createOpenRouter({
    apiKey,
    headers: {
      "HTTP-Referer":
        process.env.OPENROUTER_HTTP_REFERER ?? "http://localhost:3000",
      "X-Title": "Kompanion",
    },
  });
}

/** Resolve a provider/model id (e.g. openai/gpt-5.5) through OpenRouter. */
export function languageModel(modelId: string = ORCHESTRATOR_MODEL) {
  return getOpenRouter().chat(modelId);
}
