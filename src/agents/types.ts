import type { ToolSet } from "ai";

export type AgentStatus = "planned" | "registered" | "active" | "disabled";

/**
 * Declarative agent description used by the registry and UI.
 * Implementations plug in via `createTools` when status is `active`.
 */
export type AgentManifest = {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  /** Free-form capability tags for routing / UI. */
  capabilities: string[];
  /** Optional model override when this agent runs as a subagent. */
  model?: string;
};

export type AgentToolFactory = () => ToolSet;

export type RegisteredAgent = AgentManifest & {
  /** Returns AI SDK tools for this agent. Only used when status is `active`. */
  createTools?: AgentToolFactory;
};
