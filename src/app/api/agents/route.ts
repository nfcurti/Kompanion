import { NextResponse } from "next/server";
import { z } from "zod";

import { getRegistrySnapshot, registerAgent, slugifyAgentId } from "@/agents";
import type { AgentStatus } from "@/agents/types";
import { listSkills } from "@/lib/skills-registry";

const createAgentSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens",
    ),
  description: z.string().trim().min(1).max(500),
  status: z
    .enum(["planned", "registered", "active", "disabled"])
    .default("registered"),
  capabilities: z.array(z.string().trim().min(1)).default([]),
  model: z.string().trim().min(1).optional(),
});

export async function GET() {
  return NextResponse.json({ agents: getRegistrySnapshot() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createAgentSchema.parse(body);

    const id = slugifyAgentId(parsed.id);
    if (!id) {
      return NextResponse.json(
        { error: "Enter a valid agent id." },
        { status: 400 },
      );
    }

    const knownSkills = new Set(listSkills().map((skill) => skill.id));
    const capabilities = [
      ...new Set(
        parsed.capabilities
          .map((capability) => capability.trim())
          .filter(Boolean),
      ),
    ];

    const unknown = capabilities.filter((id) => !knownSkills.has(id));
    if (unknown.length > 0) {
      return NextResponse.json(
        {
          error: `Unknown skills: ${unknown.join(", ")}. Create them under Skills first.`,
        },
        { status: 400 },
      );
    }

    const agent = registerAgent({
      id,
      name: id,
      description: parsed.description,
      status: parsed.status as AgentStatus,
      capabilities,
      model: parsed.model,
    });

    return NextResponse.json(
      {
        agent: {
          id: agent.id,
          name: agent.name,
          description: agent.description,
          status: agent.status,
          capabilities: agent.capabilities,
          model: agent.model,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid agent payload", details: error.flatten() },
        { status: 400 },
      );
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Agent already exists")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 },
    );
  }
}
