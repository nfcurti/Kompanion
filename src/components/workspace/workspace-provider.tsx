"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type ChatStatus } from "ai";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { OrchestratorMessage } from "@/agents/orchestrator";
import type { AgentManifest } from "@/agents/types";

type WorkspaceContextValue = {
  agents: AgentManifest[];
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
  agents,
  children,
}: {
  agents: AgentManifest[];
  children: ReactNode;
}) {
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

  const value = useMemo(
    () => ({
      agents,
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
