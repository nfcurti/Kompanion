import { NextResponse } from "next/server";
import { z } from "zod";

import { isOpenAIModelId } from "@/agents/constants";
import {
  getResolvedModelId,
  setResolvedModelId,
} from "@/lib/settings-store";

const patchSettingsSchema = z.object({
  modelId: z.string().refine(isOpenAIModelId, "Pick a supported OpenAI model."),
});

export async function GET() {
  return NextResponse.json({ modelId: getResolvedModelId() });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = patchSettingsSchema.parse(body);
    const modelId = setResolvedModelId(parsed.modelId);
    return NextResponse.json({ modelId });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Pick a supported OpenAI model.", details: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Failed to save settings." },
      { status: 500 },
    );
  }
}
