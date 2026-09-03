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
  /**
   * How this agent works and how their results should be written.
   * Used when they run and when Studio drafts from their tool output.
   */
  behavior?: string;
  status: AgentStatus;
  /** Skill ids from the Skills library (routing + instructions). */
  capabilities: string[];
  /** Optional model override when this agent runs as a subagent. */
  model?: string;
};

export type AgentToolFactory = () => ToolSet;

export type RegisteredAgent = AgentManifest & {
  /** Returns AI SDK tools for this agent. Merged with attached skill tools at invoke time. */
  createTools?: AgentToolFactory;
};
