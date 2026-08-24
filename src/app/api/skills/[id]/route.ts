import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getRegistrySnapshot,
  listAgents,
  updateAgent,
} from "@/agents";
import { closeSkillBrowser } from "@/lib/skill-browser";
import { getSkill, updateSkill, unregisterSkill } from "@/lib/skills-registry";

const patchSkillSchema = z.object({
  description: z.string().trim().min(1).max(1024).optional(),
  instructions: z.string().trim().min(1).max(50_000).optional(),
  auth: z
    .object({
      enabled: z.boolean(),
      loginUrl: z.string().trim().max(500),
      username: z.string().trim().max(200),
      password: z.string().max(500),
      allowedHosts: z
        .array(z.string().trim().min(1).max(253))
        .max(20)
        .optional(),
    })
    .nullable()
    .optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const existing = getSkill(id);
    if (!existing) {
      return NextResponse.json({ error: `Skill not found: ${id}` }, { status: 404 });
    }
    const body = await request.json();
    const parsed = patchSkillSchema.parse(body);
    const { auth, ...rest } = parsed;
    const skill = updateSkill(id, {
      ...rest,
      ...(Object.hasOwn(parsed, "auth")
        ? {
            auth: auth
              ? {
                  ...auth,
                  password: auth.password || existing.auth?.password || "",
                }
              : undefined,
          }
        : {}),
    });
    return NextResponse.json({ skill });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid skill payload", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith("Skill not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update skill" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!getSkill(id)) {
    return NextResponse.json({ error: `Skill not found: ${id}` }, { status: 404 });
  }

  for (const agent of listAgents()) {
    if (!agent.capabilities.includes(id)) continue;
    updateAgent(agent.id, {
      capabilities: agent.capabilities.filter((skillId) => skillId !== id),
    });
  }

  await closeSkillBrowser(id);
  unregisterSkill(id);

  return NextResponse.json({
    ok: true,
    id,
    agents: getRegistrySnapshot(),
  });
}

