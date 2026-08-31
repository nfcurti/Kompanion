import { NextResponse } from "next/server";
import { z } from "zod";

import { isRoutineCadence } from "@/lib/routines";
import {
  getRoutine,
  unregisterRoutine,
  updateRoutine,
} from "@/lib/routines-registry";

const patchRoutineSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  agentId: z.string().trim().min(1).optional(),
  prompt: z.string().trim().min(1).max(4000).optional(),
  callback: z
    .union([z.literal(""), z.enum(["orchestrator"])])
    .optional(),
  cadenceSeconds: z.number().int().optional(),
  timezone: z.string().trim().min(1).optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const routine = getRoutine(id);
  if (!routine) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }
  return NextResponse.json({ routine });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const parsed = patchRoutineSchema.parse(body);
    if (
      parsed.cadenceSeconds != null &&
      !isRoutineCadence(parsed.cadenceSeconds)
    ) {
      return NextResponse.json(
        { error: "Pick a supported cadence." },
        { status: 400 },
      );
    }
    const { cadenceSeconds, ...rest } = parsed;
    const routine = updateRoutine(id, {
      ...rest,
      ...(cadenceSeconds != null && isRoutineCadence(cadenceSeconds)
        ? { cadenceSeconds }
        : {}),
    });
    return NextResponse.json({ routine });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid routine", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.startsWith("Routine not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to update routine" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  if (!unregisterRoutine(id)) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
