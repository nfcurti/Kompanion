"use client";

import {
  BotIcon,
  ChevronsUpDownIcon,
  CircleDotIcon,
  MessageSquarePlusIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { agentIcon, statusMeta } from "@/components/agents/agent-meta";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { mainNav } from "@/lib/navigation";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { agents, clearChat } = useWorkspace();

  const activeCount = agents.filter((agent) => agent.status === "active").length;
  const plannedCount = agents.filter((agent) => agent.status === "planned").length;

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <CircleDotIcon />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">Kompanion</span>
                    <span className="truncate text-xs text-muted-foreground">
                      Workspace
                    </span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel>Quick actions</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      clearChat();
                      router.push("/playground");
                    }}
                  >
                    <MessageSquarePlusIcon />
                    New Studio session
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/agents")}>
                    Open agents
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/capabilities")}>
                    Open capabilities
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {mainNav.map((group, groupIndex) => (
          <SidebarGroup key={`${group.items[0]?.href ?? groupIndex}`}>
            {groupIndex > 0 ? <SidebarSeparator className="mb-2" /> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.description}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {agents.length === 0 ? (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled tooltip="No agents yet">
                    <BotIcon />
                    <span>None yet</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                agents.map((agent) => {
                  const Icon = agentIcon(agent.capabilities);
                  const meta = statusMeta[agent.status];
                  return (
                    <SidebarMenuItem key={agent.id}>
                      <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === `/agents/${agent.id}`}
                            tooltip={agent.id}
                          >
                            <Link href={`/agents/${agent.id}`}>
                              <Icon />
                              <span className="font-mono">{agent.id}</span>
                            </Link>
                          </SidebarMenuButton>
                        </HoverCardTrigger>
                        <HoverCardContent side="right" align="start" className="w-72">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-mono font-medium">{agent.id}</p>
                              <Badge variant={meta.badge}>{meta.label}</Badge>
                            </div>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {agent.description}
                            </p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                      <SidebarMenuBadge>
                        <span
                          className={`size-1.5 rounded-full ${meta.dot}`}
                          aria-hidden
                        />
                      </SidebarMenuBadge>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 group-data-[collapsible=icon]:hidden">
              <p className="text-xs text-muted-foreground">
                {activeCount} active
                {plannedCount > 0 ? ` · ${plannedCount} planned` : ""}
              </p>
              <ThemeToggle />
            </div>
            <div className="hidden justify-center group-data-[collapsible=icon]:flex">
              <ThemeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
