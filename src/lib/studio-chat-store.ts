import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { UIMessage } from "ai";

import { asStudioToolMessages } from "@/lib/studio-inbox";

const DATA_DIR = path.join(process.cwd(), "data");
const CHAT_FILE = path.join(DATA_DIR, "studio-chat.json");

let messages: UIMessage[] = [];

function isUiMessage(value: unknown): value is UIMessage {
  if (!value || typeof value !== "object") return false;
  const rec = value as Record<string, unknown>;
  return (
    typeof rec.id === "string" &&
    (rec.role === "user" || rec.role === "assistant" || rec.role === "system") &&
    Array.isArray(rec.parts)
  );
}

function loadFromDisk() {
  if (!existsSync(CHAT_FILE)) return;
  try {
    const parsed = JSON.parse(readFileSync(CHAT_FILE, "utf8")) as unknown;
    const list = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === "object" &&
          Array.isArray((parsed as { messages?: unknown }).messages)
        ? (parsed as { messages: unknown[] }).messages
        : null;
    if (!list) return;
    messages = asStudioToolMessages(list.filter(isUiMessage));
  } catch {
    // Ignore corrupt store.
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    CHAT_FILE,
    `${JSON.stringify({ updatedAt: new Date().toISOString(), messages }, null, 2)}\n`,
  );
}

loadFromDisk();

export function listStudioChat(): UIMessage[] {
  return messages;
}

export function saveStudioChat(next: unknown): UIMessage[] {
  if (!Array.isArray(next)) {
    throw new Error("Chat must be an array of messages");
  }
  messages = asStudioToolMessages(next.filter(isUiMessage));
  saveToDisk();
  return messages;
}

export function clearStudioChat(): void {
  messages = [];
  saveToDisk();
}
