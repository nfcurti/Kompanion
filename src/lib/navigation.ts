import {
  BotIcon,
  Settings2Icon,
  SparklesIcon,
  SquareTerminalIcon,
  TimerIcon,
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
        title: "Studio",
        href: "/playground",
        icon: SquareTerminalIcon,
        description: "Chat with the orchestrator and inspect live activity",
      },
      {
        title: "Continuous actions",
        href: "/continuous-actions",
        icon: TimerIcon,
        description: "Schedule and trigger ongoing orchestrator jobs",
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
        description: "Register and manage specialist agents",
      },
      {
        title: "Skills",
        href: "/skills",
        icon: SparklesIcon,
        description: "Reusable instructions agents can apply",
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
        description: "Models, limits, storage, and API",
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
