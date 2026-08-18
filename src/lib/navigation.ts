import {
  BotIcon,
  HistoryIcon,
  Settings2Icon,
  SquareTerminalIcon,
  WorkflowIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const mainNav: NavGroup[] = [
  {
    label: "Build",
    items: [
      {
        title: "Playground",
        href: "/playground",
        icon: SquareTerminalIcon,
        description: "Chat with the orchestrator and test tool loops",
      },
      {
        title: "Automations",
        href: "/automations",
        icon: WorkflowIcon,
        description: "Scheduled and triggered multi-agent workflows",
      },
    ],
  },
  {
    label: "Operate",
    items: [
      {
        title: "Agents",
        href: "/agents",
        icon: BotIcon,
        description: "Fleet registry, capabilities, and deployment status",
      },
      {
        title: "Runs",
        href: "/runs",
        icon: HistoryIcon,
        description: "Execution history, tool traces, and outcomes",
      },
    ],
  },
  {
    label: "Configure",
    items: [
      {
        title: "Settings",
        href: "/settings",
        icon: Settings2Icon,
        description: "Model, gateway, and workspace preferences",
      },
    ],
  },
];

export function findNavItem(pathname: string): NavItem | undefined {
  return mainNav.flatMap((group) => group.items).find((item) => {
    if (item.href === "/") return pathname === "/";
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  });
}
