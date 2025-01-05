"use client"

import * as React from "react"
import { Home, Bot, Sliders } from "lucide-react";

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
  ],
};

interface User {
  name?: string;
  email: string;
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
            src="/AgentHub-Logo.png"
            alt="AgentHub Logo"
            width={64}
            height={64}
            className="mr-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:h-8"
          />
          <span className="font-semibold group-data-[collapsible=icon]:hidden">
            AgentHub
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
