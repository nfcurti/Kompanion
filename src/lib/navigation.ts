import {
  BotIcon,
  CircleDollarSignIcon,
  Settings2Icon,
  SparklesIcon,
  SquareTerminalIcon,
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
        title: "Budget & Costs",
        href: "/budget",
        icon: CircleDollarSignIcon,
        description: "Token usage, cached tokens, and request logs",
      },
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
