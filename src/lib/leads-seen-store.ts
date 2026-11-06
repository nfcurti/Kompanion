import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const SEEN_FILE = path.join(DATA_DIR, "leads-seen.json");
const MAX_IDS_PER_AGENT = 2500;

type SeenFile = {
  agents: Record<string, { ids: string[]; updatedAt: string }>;
};

const agents = new Map<string, string[]>();

function loadFromDisk() {
  if (!existsSync(SEEN_FILE)) return;
  try {
    const parsed = JSON.parse(readFileSync(SEEN_FILE, "utf8")) as SeenFile;
    if (!parsed?.agents || typeof parsed.agents !== "object") return;
    for (const [agentId, row] of Object.entries(parsed.agents)) {
      if (!agentId || !Array.isArray(row?.ids)) continue;
      agents.set(
        agentId,
        row.ids.filter((id): id is string => typeof id === "string" && id.length > 0),
      );
    }
  } catch {
    // Ignore corrupt store.
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  const payload: SeenFile = { agents: {} };
  for (const [agentId, ids] of agents) {
    payload.agents[agentId] = {
      ids,
      updatedAt: new Date().toISOString(),
    };
  }
  writeFileSync(SEEN_FILE, `${JSON.stringify(payload, null, 2)}\n`);
}

loadFromDisk();

export function listSeenLeadKeys(agentId: string): Set<string> {
  return new Set(agents.get(agentId) ?? []);
}

export function rememberLeadKeys(agentId: string, keys: string[]): void {
  if (!agentId || keys.length === 0) return;
  const current = agents.get(agentId) ?? [];
  const seen = new Set(current);
  const next = [...current];
  for (const key of keys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(key);
  }
  agents.set(agentId, next.slice(-MAX_IDS_PER_AGENT));
  saveToDisk();
}
