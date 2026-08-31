import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { StudioActivityKind, StudioInboxItem } from "@/lib/studio-inbox";

const DATA_DIR = path.join(process.cwd(), "data");
const INBOX_FILE = path.join(DATA_DIR, "studio-inbox.json");

const items: StudioInboxItem[] = [];

function asKind(value: unknown): StudioActivityKind {
  if (value === "capability" || value === "agent" || value === "routine") {
    return value;
  }
  return "routine";
}

function loadFromDisk() {
  if (!existsSync(INBOX_FILE)) return;
  try {
    const parsed = JSON.parse(readFileSync(INBOX_FILE, "utf8")) as unknown;
    if (!Array.isArray(parsed)) return;
    items.length = 0;
    for (const row of parsed) {
      if (!row || typeof row !== "object") continue;
      const rec = row as Partial<StudioInboxItem> & {
        routineId?: string;
        routineName?: string;
      };
      const output = rec.output?.trim() ?? "";
      if (!rec.id || !output) continue;
      items.push({
        id: rec.id,
        kind: asKind(rec.kind),
        title: rec.title ?? rec.routineName ?? "Update",
        agentId: rec.agentId,
        agentName: rec.agentName ?? rec.agentId,
        output,
        createdAt: rec.createdAt ?? new Date().toISOString(),
      });
    }
  } catch {
    // Ignore corrupt store.
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(INBOX_FILE, `${JSON.stringify(items, null, 2)}\n`);
}

loadFromDisk();

export function listStudioInbox(): StudioInboxItem[] {
  return [...items];
}

export function enqueueStudioActivity(
  input: Omit<StudioInboxItem, "id" | "createdAt">,
): StudioInboxItem {
  const item: StudioInboxItem = {
    ...input,
    title: input.title.trim() || "Update",
    output: input.output.trim(),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  if (!item.output) return item;
  items.push(item);
  saveToDisk();
  return item;
}

export function enqueueStudioInbox(
  input: Omit<StudioInboxItem, "id" | "createdAt" | "kind" | "title"> & {
    routineId?: string;
    routineName: string;
  },
): StudioInboxItem {
  return enqueueStudioActivity({
    kind: "routine",
    title: input.routineName,
    agentId: input.agentId,
    agentName: input.agentName,
    output: input.output,
  });
}

export function ackStudioInbox(ids: string[]): number {
  if (ids.length === 0) return 0;
  const drop = new Set(ids);
  const before = items.length;
  const next = items.filter((item) => !drop.has(item.id));
  items.length = 0;
  items.push(...next);
  if (items.length !== before) saveToDisk();
  return before - items.length;
}
