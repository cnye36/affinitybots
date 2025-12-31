"use client"

import * as React from "react"
import { appNavigation } from "@/components/layout/nav-config";

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
import { FeedbackButton } from "@/components/feedback/FeedbackButton";

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
      <SidebarHeader className="border-b border-violet-200/30 dark:border-violet-800/30 bg-gradient-to-r from-violet-500/5 to-purple-500/5">
        <div className="px-3 py-3">
          {/* Top row: logo + brand + trigger (expanded only) */}
          <div className="flex h-[44px] items-center">
            {/* Logo with subtle gradient ring */}
            <div className="relative mr-2 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:mr-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
              <Image
                src="/images/AffinityBots-Icon-Dark-250px.png"
                alt="AffinityBots Logo"
                width={logoSize}
                height={logoSize}
                className="relative object-contain"
              />
            </div>
            <span className="font-semibold text-base bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent group-data-[collapsible=icon]:hidden">
              AffinityBots
            </span>
            <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:hidden hover:bg-violet-100 dark:hover:bg-violet-950/50" />
          </div>
          {/* Collapsed-only trigger centered below the logo */}
          <div className="hidden group-data-[collapsible=icon]:flex justify-center mt-1">
            <SidebarTrigger className="hover:bg-violet-100 dark:hover:bg-violet-950/50" />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={appNavigation} />
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 space-y-2 group-data-[collapsible=icon]:hidden">
          <FeedbackButton />
        </div>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
