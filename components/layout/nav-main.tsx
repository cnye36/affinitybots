"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, type LucideIcon } from "lucide-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname() || ''
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const isActiveLink = (url: string) => {
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          isCollapsed && item.items ? (
            // When collapsed, clicking parent should go to its main page
            <SidebarMenuItem key={item.title} data-tutorial={item.title === "Tools" ? "tools-sidebar" : undefined}>
              <Link href={item.url}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={isActiveLink(item.url) ? 'bg-accent' : ''}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ) : (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActiveLink(item.url)}
              className="group/collapsible"
            >
              <SidebarMenuItem data-tutorial={item.title === "Tools" ? "tools-sidebar" : undefined}>
                {item.items ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <Link href={item.url}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={isActiveLink(item.url) ? 'bg-accent' : ''}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </Link>
                )}
                {item.items && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={isActiveLink(subItem.url) ? 'bg-accent' : ''}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          )
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
