import { ORCHESTRATOR_MODEL } from "@/agents/constants";

/**
 * Default platform settings shown in the Settings UI.
 * Not persisted yet — controls are read-only until storage is wired.
 */
export type PlatformSettings = {
  general: {
    workspaceName: string;
    defaultStudioMode: "chat" | "graph";
  };
  model: {
    modelId: string;
    temperature: number;
    maxOutputTokens: number;
    gatewayEnabled: boolean;
  };
  graph: {
    /** Max tool/agent loop steps per run. */
    recursionLimit: number;
    streamTokens: boolean;
    parallelToolCalls: boolean;
  };
  agents: {
    autoDelegate: boolean;
    requireToolApproval: boolean;
    defaultStatusOnRegister: "planned" | "registered" | "active";
  };
  threads: {
    persistenceEnabled: boolean;
    ttlDays: number;
    allowFork: boolean;
  };
  runs: {
    retainDays: number;
    captureToolTraces: boolean;
    captureErrors: boolean;
  };
  store: {
    checkpointerEnabled: boolean;
    namespace: string;
  };
  cron: {
    timezone: string;
    onRunCompleted: "keep" | "delete";
  };
  api: {
    publicApiEnabled: boolean;
    rateLimitPerMinute: number;
  };
  appearance: {
    theme: "system" | "light" | "dark";
  };
};

export const defaultPlatformSettings: PlatformSettings = {
  general: {
    workspaceName: "Kompanion",
    defaultStudioMode: "chat",
  },
  model: {
    modelId: ORCHESTRATOR_MODEL,
    temperature: 0.2,
    maxOutputTokens: 4096,
    gatewayEnabled: true,
  },
  graph: {
    recursionLimit: 20,
    streamTokens: true,
    parallelToolCalls: false,
  },
  agents: {
    autoDelegate: true,
    requireToolApproval: false,
    defaultStatusOnRegister: "registered",
  },
  threads: {
    persistenceEnabled: false,
    ttlDays: 30,
    allowFork: true,
  },
  runs: {
    retainDays: 14,
    captureToolTraces: true,
    captureErrors: true,
  },
  store: {
    checkpointerEnabled: false,
    namespace: "kompanion",
  },
  cron: {
    timezone: "UTC",
    onRunCompleted: "keep",
  },
  api: {
    publicApiEnabled: false,
    rateLimitPerMinute: 60,
  },
  appearance: {
    theme: "system",
  },
};
