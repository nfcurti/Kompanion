import { NextResponse } from "next/server";

import { clearUsageEvents, usageDashboard } from "@/lib/usage";

export async function GET() {
  return NextResponse.json(usageDashboard());
}

export async function DELETE() {
  clearUsageEvents();
  return NextResponse.json(usageDashboard());
}
