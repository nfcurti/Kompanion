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
import type { StudioInboxItem, StudioMessageMeta } from "@/lib/studio-inbox";
import type { StudioActivityKind } from "@/lib/studio-inbox";
import { studioWorkToolPart } from "@/lib/studio-inbox";

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
  postStudioEvent: (item: StudioInboxItem) => Promise<void>;
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

  const setMessagesRef = useRef<
    | ((
        messages:
          | OrchestratorMessage[]
          | ((messages: OrchestratorMessage[]) => OrchestratorMessage[]),
      ) => void)
    | null
  >(null);
  const { messages, sendMessage, status, stop, error, setMessages, clearError } =
    useChat<OrchestratorMessage>({
      transport,
      messages: initialMessages,
      onFinish({ message }) {
        const createdAt = new Date().toISOString();
        setMessagesRef.current?.((current) =>
          current.map((item) => {
            if (item.id !== message.id) return item;
            const meta = (item.metadata ?? {}) as StudioMessageMeta;
            if (meta.createdAt) return item;
            return {
              ...item,
              metadata: { ...meta, createdAt },
            } as OrchestratorMessage;
          }),
        );
      },
    });
  setMessagesRef.current = setMessages;

  const floorPending = useRef(initialMessages.length === 0);
  const floorQueue = useRef<StudioInboxItem[]>([]);
  const floorBusy = useRef(false);
  const floorWaiters = useRef(
    new Map<string, { resolve: () => void; reject: (error: unknown) => void }>(),
  );
  const statusRef = useRef(status);
  statusRef.current = status;
  const agentsRef = useRef(agents);
  agentsRef.current = agents;

  const drainFloor = useCallback(async () => {
    if (floorBusy.current) return;
    const chatStatus = statusRef.current;
    if (chatStatus === "submitted" || chatStatus === "streaming") return;
    const item = floorQueue.current[0];
    if (!item) return;

    floorBusy.current = true;
    if (chatStatus === "error") clearError();
    floorQueue.current.shift();
    const createdAt = item.createdAt || new Date().toISOString();

    const toolMessage = {
      id: item.id,
      role: "assistant" as const,
      metadata: {
        origin: item.kind,
        title: item.title,
        agentName: item.agentName,
        createdAt,
      } satisfies StudioMessageMeta,
      parts: [studioWorkToolPart(item)],
    } as OrchestratorMessage;

    const agent =
      agentsRef.current.find((entry) => entry.id === item.agentId) ??
      agentsRef.current.find((entry) => entry.name === item.agentName);
    const resultText =
      item.output.length > 8000
        ? `${item.output.slice(0, 8000)}\n…`
        : item.output;

    setMessages((current) => [...current, toolMessage]);
    try {
      await sendMessage(
        {
          text: [
            `A ${item.kind} named "${item.title}" just finished.`,
            item.agentName ? `The agent is ${item.agentName}.` : null,
            agent?.behavior?.trim()
              ? `Behavior: ${agent.behavior.trim()}`
              : null,
            "Write a short update for the user from this result.",
            "Do not paste JSON. Do not call tools.",
            "",
            "Result:",
            resultText,
          ]
            .filter((line) => line != null)
            .join("\n"),
          metadata: {
            hidden: true,
            createdAt,
            origin: item.kind,
            title: item.title,
            agentName: item.agentName,
          } satisfies StudioMessageMeta,
        },
        { body: { studioDraft: true } },
      );
      floorWaiters.current.get(item.id)?.resolve();
    } catch (draftError) {
      console.error("Studio failed to draft from a tool result", draftError);
      floorWaiters.current.get(item.id)?.reject(draftError);
    } finally {
      floorWaiters.current.delete(item.id);
      floorBusy.current = false;
    }
    void drainFloor();
  }, [clearError, sendMessage, setMessages]);

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
            kind: StudioActivityKind;
            title: string;
            agentId?: string;
            agentName?: string;
            output: string;
            createdAt?: string;
          }[];
        };
        const items = payload.items ?? [];
        if (cancelled) return;
        if (items.length > 0) {
          setMessages(
            items.map(
              (item) =>
                ({
                  id: item.id,
                  role: "assistant" as const,
                  metadata: {
                    origin: item.kind,
                    title: item.title,
                    agentName: item.agentName,
                    createdAt: item.createdAt,
                  },
                  parts: [studioWorkToolPart(item)],
                }) as OrchestratorMessage,
            ),
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
      void sendMessage({
        text: trimmed,
        metadata: { createdAt: new Date().toISOString() },
      });
    },
    [sendMessage],
  );

  const postStudioEvent = useCallback(
    (item: StudioInboxItem) => {
      if (!item.output.trim()) return Promise.resolve();
      return new Promise<void>((resolve, reject) => {
        floorWaiters.current.set(item.id, { resolve, reject });
        floorQueue.current.push(item);
        void drainFloor();
      });
    },
    [drainFloor],
  );

  useEffect(() => {
    if (status !== "ready") return;
    void drainFloor();
  }, [drainFloor, status]);

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
