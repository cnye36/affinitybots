"use client"

import * as React from "react"
import { Home, Bot, Sliders, Hammer, Play, TestTubeDiagonal } from "lucide-react";

import { NavMain } from "@/components/layout/nav-main";
import { NavUser } from "@/components/layout/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { ResetOnboarding } from "@/components/onboarding/ResetOnboarding";

// Navigation data structure
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Agents",
      url: "/agents",
      icon: Bot,
      items: [
        {
          title: "My Agents",
          url: "/agents",
        },
        {
          title: "Create Agent",
          url: "/agents/new",
        },
      ],
    },
    {
      title: "Tools",
      url: "/tools",
      icon: Hammer,
      items: [
        {
          title: "All Tools",
          url: "/tools",
        },
        {
          title: "Configured Tools",
          url: "/tools/configured",
        },
      ],
    },
    {
      title: "Workflows (Coming Soon)",
      url: "/workflows/workflows-coming-soon",
      icon: Sliders,
      items: [
        {
          title: "My Workflows",
          url: "/workflows/workflows-coming-soon",
        },
        {
          title: "Create Workflow",
          url: "/workflows/workflows-coming-soon",
        },
      ],
    },
    {
      title: "Playground (Coming Soon)",
      url: "/playground/playground-coming-soon",
      icon: TestTubeDiagonal,
    },
  ],
};

interface User {
  name?: string;
  email?: string;
  image?: string;
}

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user?: User }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <div className="flex h-[60px] items-center px-6">
          <Image
            src="/images/AffinityBots-Icon-Dark-250px.png"
            alt="AffinityBots Logo"
            width={64}
            height={64}
            className="mr-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
          />
          <span className="font-semibold group-data-[collapsible=icon]:hidden">
            AffinityBots
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 space-y-2">
          <ResetOnboarding />
        </div>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
