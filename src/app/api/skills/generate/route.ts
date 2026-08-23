import { APICallError, generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { languageModel, modelProvider, resolvedModelId } from "@/lib/language-model";
import { recordUsage, recordUsageFromGenerate } from "@/lib/usage";

export const maxDuration = 60;

const generateSkillSchema = z.object({
  id: z.string().trim().max(64).optional(),
  description: z.string().trim().min(1).max(1024),
});

export async function POST(request: Request) {
  const startedAt = Date.now();
  const modelId = resolvedModelId();

  try {
    const body = await request.json();
    const { id, description } = generateSkillSchema.parse(body);

    const result = await generateText({
      model: languageModel(modelId),
      system: `You write comprehensive agent skills in Markdown.

Output ONLY the skill body (no YAML frontmatter, no code fences wrapping the whole document).

Follow this structure closely:
# <Title>

## Instructions
Clear, step-by-step guidance the agent should follow. Be specific and actionable. Prefer concise bullets over fluff. Assume the agent is capable — only include domain knowledge it would not already know.

## Examples
2–4 concrete examples of when to apply the skill and what a good outcome looks like.

## Guardrails
What to avoid, fail closed on, or escalate.

Authoring rules:
- Third person or imperative instructions to the agent (not "I will…").
- Include both what to do and when it applies, grounded in the user's description.
- The platform provides skillLogin, skillFetch, and Chromium tools skillBrowserOpen / skillBrowserAct / skillBrowserSnapshot / skillBrowserClose. If the skill needs a site account, instruct the agent to call skillLogin({ skillId }) then skillFetch for HTML sites. If the site is JavaScript-rendered or HTTP login fails, instruct skillBrowserOpen({ skillId, login: true }) then snapshot/act — credentials are stored on the skill, never asked in chat.
- Do not tell the agent to skip login when the user will save credentials on the skill. Prefer public pages first, then log in for gated listings the user is entitled to.
- Do not generate Playwright scripts or custom APIs. Use only the platform tools.
- No invented APIs. Do not bypass captchas, paywalls without credentials, or access controls.
- Keep it comprehensive but token-efficient.`,
      prompt: `Write a comprehensive skill body for this skill.

${id ? `Skill id: ${id}\n` : ""}Description (what & when):
${description}`,
      abortSignal: request.signal,
    });

    recordUsageFromGenerate({
      source: "skills.generate",
      action: id ? `Generate skill · ${id}` : "Generate skill",
      status: "ok",
      provider: modelProvider(),
      model: modelId,
      durationMs: Date.now() - startedAt,
      result,
    });

    const instructions = result.text.trim();
    if (!instructions) {
      return NextResponse.json(
        { error: "Model returned empty instructions." },
        { status: 502 },
      );
    }

    return NextResponse.json({ instructions });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Add a description first.", details: error.flatten() },
        { status: 400 },
      );
    }
    recordUsage({
      source: "skills.generate",
      action: "Generate skill",
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
    console.error("skill generate failed", error);
    if (APICallError.isInstance(error)) {
      const status =
        error.statusCode && error.statusCode >= 400 && error.statusCode < 600
          ? error.statusCode
          : 502;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json(
      { error: "Failed to generate skill instructions." },
      { status: 500 },
    );
  }
}
