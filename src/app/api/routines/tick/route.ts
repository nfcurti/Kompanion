import { NextResponse } from "next/server";

import { invokeRoutineGraph } from "@/lib/routine-graph";
import { isLiveCadence } from "@/lib/routines";
import { getRoutine, listDueRoutines } from "@/lib/routines-registry";

export const maxDuration = 180;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const liveOnly = new URL(request.url).searchParams.get("live") === "1";
  const secret = process.env.CRON_SECRET;
  if (!liveOnly && secret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${secret}`) {
      return unauthorized();
    }
  }

  const due = listDueRoutines().filter((routine) =>
    liveOnly ? isLiveCadence(routine.cadenceSeconds) : true,
  );
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
