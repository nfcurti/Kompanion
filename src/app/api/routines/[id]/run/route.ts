import { NextResponse } from "next/server";

import { invokeRoutineGraph } from "@/lib/routine-graph";
import { getRoutine } from "@/lib/routines-registry";

export const maxDuration = 120;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const routine = getRoutine(id);
  if (!routine) {
    return NextResponse.json({ error: "Routine not found" }, { status: 404 });
  }

  const next = await invokeRoutineGraph(routine, request.signal);
  return NextResponse.json({ routine: next });
}
