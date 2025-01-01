"use client"

import * as React from "react"
import {
  Home,
  Bot,
  Sliders,
  Settings2,
  Command,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import Image from "next/image"

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
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings",
        },
        {
          title: "Profile",
          url: "/settings/profile",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
      ],
    },
  ],
}

export function AppSidebar({ user, ...props }: React.ComponentProps<typeof Sidebar> & { user?: any }) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="border-b">
        <div className="flex h-[60px] items-center px-6">
          <Image 
            src="/AgentHub-Logo.png" 
            alt="AgentHub Logo" 
            width={64} 
            height={64} 
            className="mr-2" 
          />
          <span className="font-semibold">AgentHub</span>
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
  )
}
