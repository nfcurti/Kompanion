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
        description: "Ask once. Studio picks an agent to help.",
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
        description: "Work that repeats on a schedule or a trigger.",
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
