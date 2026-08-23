import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

import {
  isOpenAIModelId,
  ORCHESTRATOR_MODEL,
  type OpenAIModelId,
} from "@/agents/constants";

const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

type StoredSettings = {
  modelId?: string;
};

let modelId: OpenAIModelId = ORCHESTRATOR_MODEL;

function normalizeModelId(value: string | undefined): OpenAIModelId {
  if (value && isOpenAIModelId(value)) return value;
  return ORCHESTRATOR_MODEL;
}

function loadFromDisk() {
  if (!existsSync(SETTINGS_FILE)) return;
  try {
    const raw = readFileSync(SETTINGS_FILE, "utf8");
    const parsed = JSON.parse(raw) as StoredSettings;
    modelId = normalizeModelId(parsed?.modelId);
  } catch {
    modelId = ORCHESTRATOR_MODEL;
  }
}

function saveToDisk() {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(
    SETTINGS_FILE,
    `${JSON.stringify({ modelId }, null, 2)}\n`,
    "utf8",
  );
}

loadFromDisk();

export function getResolvedModelId(): OpenAIModelId {
  return modelId;
}

export function setResolvedModelId(value: string): OpenAIModelId {
  modelId = normalizeModelId(value);
  saveToDisk();
  return modelId;
}
