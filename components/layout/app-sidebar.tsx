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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { ResetOnboarding } from "@/components/onboarding/ResetOnboarding";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

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
      title: "Workflows",
      url: "/workflows",
      icon: Sliders,
      items: [
        {
          title: "My Workflows",
          url: "/workflows",
        },
        {
          title: "Create Workflow",
          url: "/workflows/new",
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
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const logoSize = isCollapsed ? 36 : 64;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <div className="px-3 py-2">
          {/* Top row: logo + brand + trigger (expanded only) */}
          <div className="flex h-[44px] items-center">
            <Image
              src="/images/AffinityBots-Icon-Dark-250px.png"
              alt="AffinityBots Logo"
              width={logoSize}
              height={logoSize}
              className="mr-2 object-contain group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:mr-0"
            />
            <span className="font-semibold group-data-[collapsible=icon]:hidden">
              AffinityBots
            </span>
            <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden" />
          </div>
          {/* Collapsed-only trigger centered below the logo */}
          <div className="hidden group-data-[collapsible=icon]:flex justify-center mt-1">
            <SidebarTrigger />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 space-y-2 group-data-[collapsible=icon]:hidden">
          <ResetOnboarding />
          <FeedbackButton />
        </div>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
