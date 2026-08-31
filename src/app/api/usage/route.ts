import { NextResponse } from "next/server";

import { clearUsageEvents, usageDashboard } from "@/lib/usage";

export async function GET(request: Request) {
  const agentId = new URL(request.url).searchParams.get("agentId")?.trim();
  return NextResponse.json(
    usageDashboard(500, agentId || undefined),
  );
}

export async function DELETE() {
  clearUsageEvents();
  return NextResponse.json(usageDashboard());
}
