export type StudioActivityKind = "routine" | "capability" | "agent";

export type StudioMessageMeta = {
  origin?: StudioActivityKind;
  title?: string;
  agentName?: string;
  createdAt?: string;
  /** Internal continue-turn. Not shown in the thread. */
  hidden?: boolean;
};

export type StudioInboxItem = {
  id: string;
  kind: StudioActivityKind;
  title: string;
  agentId?: string;
  agentName?: string;
  output: string;
  createdAt: string;
};

export function speakerLabel(meta?: StudioMessageMeta | null): string {
  if (!meta?.origin) return "Studio";
  if (meta.origin === "routine") {
    return meta.agentName
      ? `${meta.agentName} · Routine`
      : meta.title
        ? `Routine · ${meta.title}`
        : "Routine";
  }
  if (meta.origin === "capability") {
    return meta.title ? `Capability · ${meta.title}` : "Capability";
  }
  return meta.agentName ?? "Agent";
}

export function parseStudioWorkOutput(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return trimmed;
  }
}

export function studioWorkToolPart(item: {
  id: string;
  kind: StudioActivityKind;
  title: string;
  agentId?: string;
  agentName?: string;
  output: string;
}) {
  return {
    type: "tool-reportWork" as const,
    toolCallId: item.id,
    state: "output-available" as const,
    providerExecuted: true,
    input: {
      origin: item.kind,
      title: item.title,
      ...(item.agentId ? { agentId: item.agentId } : {}),
    },
    output: {
      ok: true,
      result: parseStudioWorkOutput(item.output),
      agentName: item.agentName,
    },
  };
}

function isJsonBlob(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    JSON.parse(trimmed);
    return true;
  } catch {
    return false;
  }
}

function asActivityKind(value: unknown): StudioActivityKind {
  if (value === "routine" || value === "capability" || value === "agent") {
    return value;
  }
  return "agent";
}

/** Turn old JSON chat bubbles into completed tool parts (OpenAI tool-message shape). */
export function asStudioToolMessages<T extends { id: string; role: string; parts: unknown[]; metadata?: unknown }>(
  messages: T[],
): T[] {
  return messages.map((message) => {
    if (message.role !== "assistant") return message;
    const parts = message.parts as Array<{ type?: string; text?: string }>;
    if (parts.some((part) => typeof part.type === "string" && part.type.startsWith("tool-"))) {
      return message;
    }
    const textParts = parts.filter(
      (part) => part.type === "text" && typeof part.text === "string" && part.text.trim(),
    );
    if (textParts.length !== 1 || !isJsonBlob(textParts[0]?.text ?? "")) {
      return message;
    }
    const meta = (message.metadata ?? {}) as StudioMessageMeta;
    return {
      ...message,
      parts: [
        studioWorkToolPart({
          id: message.id,
          kind: asActivityKind(meta.origin),
          title: meta.title ?? "Update",
          agentName: meta.agentName,
          output: textParts[0]?.text ?? "",
        }),
      ],
    };
  });
}
