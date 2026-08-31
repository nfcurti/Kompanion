import { NextResponse } from "next/server";
import { z } from "zod";

import {
  ackStudioInbox,
  listStudioInbox,
} from "@/lib/studio-inbox-store";

const ackSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  return NextResponse.json({ items: listStudioInbox() });
}

export async function POST(request: Request) {
  try {
    const parsed = ackSchema.parse(await request.json());
    const acked = ackStudioInbox(parsed.ids);
    return NextResponse.json({ acked });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid inbox ack", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to ack inbox" },
      { status: 500 },
    );
  }
}
