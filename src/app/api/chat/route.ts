import { createAgentUIStreamResponse } from "ai";

import { createOrchestrator } from "@/agents/orchestrator";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { messages } = await request.json();

  const orchestrator = createOrchestrator();

  return createAgentUIStreamResponse({
    agent: orchestrator,
    uiMessages: messages,
    abortSignal: request.signal,
  });
}
