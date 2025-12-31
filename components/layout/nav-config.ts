import { BarChart3, Bot, Hammer, Home, Sliders, TestTubeDiagonal, type LucideIcon } from "lucide-react"

export interface AppNavItem {
  title: string
  url: string
  icon?: LucideIcon
  section?: string // Added for color theming
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
		section: "dashboard",
	},

  {
    title: "Agents",
    url: "/agents",
    icon: Bot,
    section: "agents",
  },
  {
    title: "Tools",
    url: "/tools",
    icon: Hammer,
    section: "tools",
  },
  {
    title: "Workflows",
    url: "/workflows",
    icon: Sliders,
    section: "workflows",
  },
  {
    title: "Playground",
    url: "/playground",
    icon: TestTubeDiagonal,
    section: "playground",
  },
  {
		title: "Analytics",
		url: "/analytics",
		icon: BarChart3,
		section: "analytics",
	},
]
