"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import type { AgentManifest } from "@/agents/types";
import type { Skill } from "@/lib/skills";
import type { StudioMessageMeta } from "@/lib/studio-inbox";

type WorkspaceContextValue = {
  agents: AgentManifest[];
  setAgents: (agents: AgentManifest[]) => void;
  refreshAgents: () => Promise<void>;
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  refreshSkills: () => Promise<void>;
  modelId: string;
  setModelId: (id: string) => void;
  saveModelId: (id: string) => Promise<void>;
  messages: OrchestratorMessage[];
  status: ChatStatus;
  error: Error | undefined;
  sendMessage: (text: string) => void;
  postStudioEvent: (input: {
    text: string;
    metadata: StudioMessageMeta;
  }) => void;
  stop: () => void;
  clearChat: () => void;
  inspectorOpen: boolean;
  setInspectorOpen: (open: boolean) => void;
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  agents: initialAgents,
  skills: initialSkills,
  modelId: initialModelId,
  chatMessages: initialMessages,
  children,
}: {
  agents: AgentManifest[];
  skills: Skill[];
  modelId: string;
  chatMessages: OrchestratorMessage[];
  children: ReactNode;
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [skills, setSkills] = useState(initialSkills);
  const [modelId, setModelId] = useState(initialModelId);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } =
    useChat<OrchestratorMessage>({
      transport,
      messages: initialMessages,
    });

  const floorPending = useRef(initialMessages.length === 0);

  useEffect(() => {
    if (!floorPending.current) return;
    let cancelled = false;

    async function hydrate() {
      try {
        const response = await fetch("/api/studio/feed");
        if (!response.ok) return;
        const payload = (await response.json()) as {
          items?: {
            id: string;
            kind: StudioMessageMeta["origin"];
            title: string;
            agentName?: string;
            output: string;
          }[];
        };
        const items = payload.items ?? [];
        if (cancelled) return;
        if (items.length > 0) {
          setMessages(
            items.map((item) => ({
              id: item.id,
              role: "assistant" as const,
              metadata: {
                origin: item.kind,
                title: item.title,
                agentName: item.agentName,
              },
              parts: [{ type: "text" as const, text: item.output }],
            })) as OrchestratorMessage[],
          );
        }
      } finally {
        floorPending.current = false;
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [setMessages]);

  useEffect(() => {
    if (status !== "ready") return;
    if (floorPending.current) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/studio/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [messages, status]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      void sendMessage({ text: trimmed });
    },
    [sendMessage],
  );

  const postStudioEvent = useCallback(
    (input: { text: string; metadata: StudioMessageMeta }) => {
      const trimmed = input.text.trim();
      if (!trimmed) return;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          metadata: input.metadata,
          parts: [{ type: "text", text: trimmed }],
        } as OrchestratorMessage,
      ]);
    },
    [setMessages],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
  }, [setMessages]);

  const refreshAgents = useCallback(async () => {
    const response = await fetch("/api/agents");
    if (!response.ok) return;
    const payload = (await response.json()) as { agents: AgentManifest[] };
    setAgents(payload.agents);
  }, []);

  const refreshSkills = useCallback(async () => {
    const response = await fetch("/api/skills");
    if (!response.ok) return;
    const payload = (await response.json()) as { skills: Skill[] };
    setSkills(payload.skills);
  }, []);

  const saveModelId = useCallback(async (id: string) => {
    const response = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelId: id }),
    });
    const payload = (await response.json()) as {
      modelId?: string;
      error?: string;
    };
    if (!response.ok || !payload.modelId) {
      throw new Error(payload.error || "Failed to save model");
    }
    setModelId(payload.modelId);
  }, []);

  useEffect(() => {
    void refreshAgents();
    void refreshSkills();
  }, [refreshAgents, refreshSkills]);

  const value = useMemo(
    () => ({
      agents,
      setAgents,
      refreshAgents,
      skills,
      setSkills,
      refreshSkills,
      modelId,
      setModelId,
      saveModelId,
      messages,
      status,
      error,
      sendMessage: send,
      postStudioEvent,
      stop,
      clearChat,
      inspectorOpen,
      setInspectorOpen,
      selectedAgentId,
      setSelectedAgentId,
    }),
    [
      agents,
      refreshAgents,
      skills,
      refreshSkills,
      modelId,
      saveModelId,
      messages,
      status,
      error,
      send,
      postStudioEvent,
      stop,
      clearChat,
      inspectorOpen,
      selectedAgentId,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return context;
}
