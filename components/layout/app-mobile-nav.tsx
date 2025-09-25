"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bot, Hammer, Home, Plus, Settings2 } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const mobileNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Agents",
    href: "/agents",
    icon: Bot,
  },
  {
    title: "Tools",
    href: "/tools",
    icon: Hammer,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings2,
  },
] as const

export function AppMobileNav() {
  const pathname = usePathname() || ""

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background px-4 py-3 md:hidden">
        <SidebarTrigger className="h-10 w-10 rounded-md border border-border" />
        <Link href="/dashboard" className="flex flex-1 items-center gap-2">
          <Image
            src="/images/AffinityBots-Icon-Dark-250px.png"
            alt="AffinityBots"
            width={28}
            height={28}
            className="h-7 w-7 rounded"
          />
          <span className="text-base font-semibold">AffinityBots</span>
        </Link>
        <Link href="/agents/new">
          <Button size="sm" className="gap-2 px-3">
            <Plus className="h-4 w-4" />
            <span>Create</span>
          </Button>
        </Link>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden" aria-label="Primary">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.title}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.title}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
