import { NextResponse } from "next/server";
import { z } from "zod";

import {
  listRoutines,
  registerRoutine,
} from "@/lib/routines-registry";
import { isRoutineInterval } from "@/lib/routines";

const createRoutineSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(500).optional(),
  agentId: z.string().trim().min(1),
  prompt: z.string().trim().min(1).max(4000),
  intervalMinutes: z.number().int(),
  status: z.enum(["draft", "active", "paused"]).optional(),
  timezone: z.string().trim().min(1).optional(),
});

export async function GET() {
  return NextResponse.json({ routines: listRoutines() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createRoutineSchema.parse(body);
    if (!isRoutineInterval(parsed.intervalMinutes)) {
      return NextResponse.json(
        { error: "Pick a supported interval." },
        { status: 400 },
      );
    }

    const routine = registerRoutine({
      ...parsed,
      intervalMinutes: parsed.intervalMinutes,
    });
    return NextResponse.json({ routine }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid routine", details: error.flatten() },
        { status: 400 },
      );
    }
    if (error instanceof Error) {
      const message = error.message;
      if (
        message.startsWith("Agent not found") ||
        message.includes("has no capabilities") ||
        message.startsWith("Enter a valid")
      ) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Failed to create routine" },
      { status: 500 },
    );
  }
}
