import { NextResponse } from "next/server";

import { listStudioChat, saveStudioChat } from "@/lib/studio-chat-store";

export async function GET() {
  return NextResponse.json({ messages: listStudioChat() });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { messages?: unknown };
    const messages = saveStudioChat(body.messages);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save chat",
      },
      { status: 400 },
    );
  }
}
