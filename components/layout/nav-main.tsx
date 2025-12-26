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
  const { state, isMobile, setOpenMobile } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const isActiveLink = (url: string) => {
    return pathname === url || pathname.startsWith(`${url}/`)
  }

  const handleNavigate = () => {
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-violet-600/70 dark:text-violet-400/70 uppercase tracking-wider">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          isCollapsed && item.items ? (
            // When collapsed, clicking parent should go to its main page
            <SidebarMenuItem key={item.title} data-tutorial={item.title === "Tools" ? "tools-sidebar" : undefined}>
              <Link href={item.url} onClick={handleNavigate}>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={
                    isActiveLink(item.url)
                      ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-l-2 border-violet-500 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-purple-500/20'
                      : 'hover:bg-violet-500/5'
                  }
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
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={
                        isActiveLink(item.url)
                          ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-l-2 border-violet-500 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-purple-500/20'
                          : 'hover:bg-violet-500/5'
                      }
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <Link href={item.url} onClick={handleNavigate}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={
                        isActiveLink(item.url)
                          ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border-l-2 border-violet-500 dark:border-violet-400 text-violet-600 dark:text-violet-400 hover:from-violet-500/20 hover:to-purple-500/20'
                          : 'hover:bg-violet-500/5'
                      }
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
                            className={
                              isActiveLink(subItem.url)
                                ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 border-l-2 border-violet-500 dark:border-violet-400 hover:from-violet-500/20 hover:to-purple-500/20'
                                : 'hover:bg-violet-500/5'
                            }
                          >
                            <Link href={subItem.url} onClick={handleNavigate}>
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
