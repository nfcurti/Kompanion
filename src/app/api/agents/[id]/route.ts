import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getAgent,
  getRegistrySnapshot,
  unregisterAgent,
  updateAgent,
} from "@/agents";
import type { AgentStatus } from "@/agents/types";
import { listSkills } from "@/lib/skills-registry";

const patchAgentSchema = z.object({
  description: z.string().trim().min(1).max(500).optional(),
  behavior: z.string().max(4000).optional(),
  status: z.enum(["planned", "registered", "active", "disabled"]).optional(),
  capabilities: z.array(z.string().trim().min(1)).optional(),
  model: z.string().trim().max(120).optional(),
});

function toPayload(agent: NonNullable<ReturnType<typeof getAgent>>) {
  return {
    id: agent.id,
    name: agent.name,
    description: agent.description,
    behavior: agent.behavior,
    status: agent.status,
    capabilities: agent.capabilities,
    model: agent.model,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const agent = getAgent(id);
  if (!agent) {
    return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
  }
  return NextResponse.json({ agent: toPayload(agent) });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!getAgent(id)) {
      return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
    }

    const body = await request.json();
    const parsed = patchAgentSchema.parse(body);

    if (parsed.capabilities) {
      const knownSkills = new Set(listSkills().map((skill) => skill.id));
      const capabilities = [...new Set(parsed.capabilities.filter(Boolean))];
      const unknown = capabilities.filter((skillId) => !knownSkills.has(skillId));
      if (unknown.length > 0) {
        return NextResponse.json(
          {
            error: `Unknown capabilities: ${unknown.join(", ")}. Add them under Capabilities first.`,
          },
          { status: 400 },
        );
      }
      parsed.capabilities = capabilities;
    }

    const agent = updateAgent(id, {
      ...parsed,
      ...(Object.hasOwn(parsed, "behavior")
        ? { behavior: parsed.behavior?.trim() || undefined }
        : {}),
      ...(Object.hasOwn(parsed, "model")
        ? { model: parsed.model || undefined }
        : {}),
      ...(parsed.status ? { status: parsed.status as AgentStatus } : {}),
    });

    return NextResponse.json({ agent: toPayload(agent) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid agent payload", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith("Agent not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getAgent(id)) {
    return NextResponse.json({ error: `Agent not found: ${id}` }, { status: 404 });
  }
  unregisterAgent(id);
  return NextResponse.json({
    ok: true,
    id,
    agents: getRegistrySnapshot(),
  });
}
