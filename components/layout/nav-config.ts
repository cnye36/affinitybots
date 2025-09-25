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
]
