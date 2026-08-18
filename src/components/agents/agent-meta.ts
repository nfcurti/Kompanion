import type { AgentStatus } from "@/agents/types";
import { BotIcon, type LucideIcon } from "lucide-react";

export const statusMeta: Record<
  AgentStatus,
  {
    label: string;
    badge: "secondary" | "outline" | "default" | "destructive";
    dot: string;
  }
> = {
  active: {
    label: "Active",
    badge: "default",
    dot: "bg-foreground",
  },
  registered: {
    label: "Registered",
    badge: "secondary",
    dot: "bg-muted-foreground",
  },
  planned: {
    label: "Planned",
    badge: "outline",
    dot: "bg-border",
  },
  disabled: {
    label: "Disabled",
    badge: "destructive",
    dot: "bg-destructive",
  },
};

export function agentIcon(_capabilities: string[] = []): LucideIcon {
  return BotIcon;
}
