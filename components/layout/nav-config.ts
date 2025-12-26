import { Bot, Hammer, Home, Sliders, TestTubeDiagonal, type LucideIcon } from "lucide-react"

export interface AppNavItem {
  title: string
  url: string
  icon?: LucideIcon
  items?: {
    title: string
    url: string
  }[]
}

export const appNavigation: AppNavItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Agents",
    url: "/agents",
    icon: Bot,
    
  },
  {
    title: "Tools",
    url: "/tools",
    icon: Hammer,
    
  },
  {
    title: "Workflows",
    url: "/workflows",
    icon: Sliders,
    
  },
  {
    title: "Playground (Coming Soon)",
    url: "/playground/playground-coming-soon",
    icon: TestTubeDiagonal,
  },
]
