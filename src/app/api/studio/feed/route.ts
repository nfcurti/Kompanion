import { NextResponse } from "next/server";

import { listStudioFloor } from "@/lib/studio-floor";

export async function GET() {
  return NextResponse.json({ items: listStudioFloor() });
}
