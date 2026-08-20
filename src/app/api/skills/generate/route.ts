import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

import { ORCHESTRATOR_MODEL } from "@/agents/constants";

export const maxDuration = 60;

const generateSkillSchema = z.object({
  id: z.string().trim().max(64).optional(),
  description: z.string().trim().min(1).max(1024),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, description } = generateSkillSchema.parse(body);

    const { text } = await generateText({
      model: ORCHESTRATOR_MODEL,
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
- No invented APIs, credentials, or tools the platform does not provide.
- Keep it comprehensive but token-efficient.`,
      prompt: `Write a comprehensive skill body for this skill.

${id ? `Skill id: ${id}\n` : ""}Description (what & when):
${description}`,
      abortSignal: request.signal,
    });

    const instructions = text.trim();
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
    console.error("skill generate failed", error);
    return NextResponse.json(
      { error: "Failed to generate skill instructions." },
      { status: 500 },
    );
  }
}
