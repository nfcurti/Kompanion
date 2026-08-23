import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listSkills,
  registerSkill,
  slugifySkillId,
} from "@/lib/skills-registry";

const skillAuthSchema = z
  .object({
    enabled: z.boolean(),
    loginUrl: z.string().trim().max(500),
    username: z.string().trim().max(200),
    password: z.string().max(500),
    allowedHosts: z.array(z.string().trim().min(1).max(253)).max(20).optional(),
  })
  .optional();

const createSkillSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers, and hyphens",
    ),
  description: z.string().trim().min(1).max(1024),
  instructions: z.string().trim().min(1).max(50_000),
  auth: skillAuthSchema,
});

export async function GET() {
  return NextResponse.json({ skills: listSkills() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createSkillSchema.parse(body);

    const id = slugifySkillId(parsed.id);
    if (!id) {
      return NextResponse.json(
        { error: "Enter a valid skill id." },
        { status: 400 },
      );
    }

    const skill = registerSkill({
      id,
      name: id,
      description: parsed.description,
      instructions: parsed.instructions,
      auth: parsed.auth,
    });

    return NextResponse.json({ skill }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid skill payload", details: error.flatten() },
        { status: 400 },
      );
    }
    if (
      error instanceof Error &&
      error.message.startsWith("Skill already exists")
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 },
    );
  }
}
