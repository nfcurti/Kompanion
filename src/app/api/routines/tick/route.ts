import { NextResponse } from "next/server";

import { invokeRoutineGraph } from "@/lib/routine-graph";
import { getRoutine, listDueRoutines } from "@/lib/routines-registry";

export const maxDuration = 120;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return unauthorized();
    }
  }

  const due = listDueRoutines();
  const ran: string[] = [];

  for (const routine of due) {
    const latest = getRoutine(routine.id);
    if (!latest) continue;
    await invokeRoutineGraph(latest, request.signal);
    ran.push(routine.id);
  }

  return NextResponse.json({
    ok: true,
    due: due.length,
    ran,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
