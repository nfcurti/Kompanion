import {
  BotIcon,
  CircleDollarSignIcon,
  RepeatIcon,
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
    label: "Workspace",
    items: [
      {
        title: "Studio",
        href: "/playground",
        icon: SquareTerminalIcon,
        description: "The floor. Agents, capabilities, and routines report here.",
      },
      {
        title: "Agents",
        href: "/agents",
        icon: BotIcon,
        description: "Your team. Each agent has their own capabilities.",
      },
      {
        title: "Routines",
        href: "/routines",
        icon: RepeatIcon,
        description: "Work an agent keeps doing, from live to daily.",
      },
      {
        title: "Capabilities",
        href: "/capabilities",
        icon: SparklesIcon,
        description: "Playbooks an agent can follow.",
      },
    ],
  },
  {
    label: "Workspace",
    items: [
      {
        title: "Budget",
        href: "/budget",
        icon: CircleDollarSignIcon,
        description: "Token use and estimated cost for chats and routines.",
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings2Icon,
        description: "Model, appearance, and workspace defaults.",
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
