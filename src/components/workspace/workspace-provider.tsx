"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import type { AgentManifest } from "@/agents/types";
import type { Skill } from "@/lib/skills";

type WorkspaceContextValue = {
  agents: AgentManifest[];
  setAgents: (agents: AgentManifest[]) => void;
  refreshAgents: () => Promise<void>;
  skills: Skill[];
  setSkills: (skills: Skill[]) => void;
  refreshSkills: () => Promise<void>;
  messages: OrchestratorMessage[];
  status: ChatStatus;
  error: Error | undefined;
  sendMessage: (text: string) => void;
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
  children,
}: {
  agents: AgentManifest[];
  skills: Skill[];
  children: ReactNode;
}) {
  const [agents, setAgents] = useState(initialAgents);
  const [skills, setSkills] = useState(initialSkills);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat" }),
    [],
  );

  const { messages, sendMessage, status, stop, error, setMessages } =
    useChat<OrchestratorMessage>({
      transport,
    });

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      void sendMessage({ text: trimmed });
    },
    [sendMessage],
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
      messages,
      status,
      error,
      sendMessage: send,
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
      messages,
      status,
      error,
      send,
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
