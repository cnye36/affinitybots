/**
 * Section color themes for the application
 * Each section has its own color scheme that works in both light and dark modes
 */

export interface SectionTheme {
	// Gradient colors (from-to)
	gradientFrom: string
	gradientTo: string
	// Sidebar highlight colors
	sidebarBg: string
	sidebarBorder: string
	sidebarText: string
	sidebarHoverBg: string
	// Page header colors
	headerGradient: string
	// Button/accent colors
	accentBg: string
	accentHover: string
	// Border and subtle backgrounds
	borderColor: string
	subtleBg: string
}

export const sectionThemes: Record<string, SectionTheme> = {
	dashboard: {
		gradientFrom: "from-violet-600",
		gradientTo: "to-purple-600",
		sidebarBg: "bg-gradient-to-r from-violet-500/10 to-purple-500/10",
		sidebarBorder: "border-violet-500 dark:border-violet-400",
		sidebarText: "text-violet-600 dark:text-violet-400",
		sidebarHoverBg: "hover:from-violet-500/20 hover:to-purple-500/20",
		headerGradient: "bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400",
		accentBg: "bg-gradient-to-r from-violet-600 to-purple-600",
		accentHover: "hover:from-violet-500 hover:to-purple-500",
		borderColor: "border-violet-500/50",
		subtleBg: "bg-violet-500/10",
	},
	agents: {
		gradientFrom: "from-blue-600",
		gradientTo: "to-indigo-600",
		sidebarBg: "bg-gradient-to-r from-blue-500/10 to-indigo-500/10",
		sidebarBorder: "border-blue-500 dark:border-blue-400",
		sidebarText: "text-blue-600 dark:text-blue-400",
		sidebarHoverBg: "hover:from-blue-500/20 hover:to-indigo-500/20",
		headerGradient: "bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400",
		accentBg: "bg-gradient-to-r from-blue-600 to-indigo-600",
		accentHover: "hover:from-blue-500 hover:to-indigo-500",
		borderColor: "border-blue-500/50",
		subtleBg: "bg-blue-500/10",
	},
	tools: {
		gradientFrom: "from-teal-600",
		gradientTo: "to-emerald-600",
		sidebarBg: "bg-gradient-to-r from-teal-500/10 to-emerald-500/10",
		sidebarBorder: "border-teal-500 dark:border-teal-400",
		sidebarText: "text-teal-600 dark:text-teal-400",
		sidebarHoverBg: "hover:from-teal-500/20 hover:to-emerald-500/20",
		headerGradient: "bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400",
		accentBg: "bg-gradient-to-r from-teal-600 to-emerald-600",
		accentHover: "hover:from-teal-500 hover:to-emerald-500",
		borderColor: "border-teal-500/50",
		subtleBg: "bg-teal-500/10",
	},
	workflows: {
		gradientFrom: "from-cyan-600",
		gradientTo: "to-sky-600",
		sidebarBg: "bg-gradient-to-r from-cyan-500/10 to-sky-500/10",
		sidebarBorder: "border-cyan-500 dark:border-cyan-400",
		sidebarText: "text-cyan-600 dark:text-cyan-400",
		sidebarHoverBg: "hover:from-cyan-500/20 hover:to-sky-500/20",
		headerGradient: "bg-gradient-to-r from-cyan-600 to-sky-600 dark:from-cyan-400 dark:to-sky-400",
		accentBg: "bg-gradient-to-r from-cyan-600 to-sky-600",
		accentHover: "hover:from-cyan-500 hover:to-sky-500",
		borderColor: "border-cyan-500/50",
		subtleBg: "bg-cyan-500/10",
	},
	playground: {
		gradientFrom: "from-orange-600",
		gradientTo: "to-amber-600",
		sidebarBg: "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
		sidebarBorder: "border-orange-500 dark:border-orange-400",
		sidebarText: "text-orange-600 dark:text-orange-400",
		sidebarHoverBg: "hover:from-orange-500/20 hover:to-amber-500/20",
		headerGradient: "bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400",
		accentBg: "bg-gradient-to-r from-orange-600 to-amber-600",
		accentHover: "hover:from-orange-500 hover:to-amber-500",
		borderColor: "border-orange-500/50",
		subtleBg: "bg-orange-500/10",
	},
	analytics: {
		gradientFrom: "from-emerald-600",
		gradientTo: "to-green-600",
		sidebarBg: "bg-gradient-to-r from-emerald-500/10 to-green-500/10",
		sidebarBorder: "border-emerald-500 dark:border-emerald-400",
		sidebarText: "text-emerald-600 dark:text-emerald-400",
		sidebarHoverBg: "hover:from-emerald-500/20 hover:to-green-500/20",
		headerGradient: "bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400",
		accentBg: "bg-gradient-to-r from-emerald-600 to-green-600",
		accentHover: "hover:from-emerald-500 hover:to-green-500",
		borderColor: "border-emerald-500/50",
		subtleBg: "bg-emerald-500/10",
	},
}

/**
 * Get the section key from a pathname
 */
export function getSectionFromPath(pathname: string): string {
	if (pathname.startsWith("/dashboard")) return "dashboard"
	if (pathname.startsWith("/agents")) return "agents"
	if (pathname.startsWith("/tools")) return "tools"
	if (pathname.startsWith("/workflows")) return "workflows"
	if (pathname.startsWith("/playground")) return "playground"
	if (pathname.startsWith("/analytics")) return "analytics"
	return "dashboard" // default fallback
}

/**
 * Get theme for a specific section
 */
export function getSectionTheme(section: string): SectionTheme {
	return sectionThemes[section] || sectionThemes.dashboard
}
