import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import type { OfficialMcpServerMeta } from "@/lib/mcp/officialMcpServers"

/**
 * Hook to get the correct logo URL for an MCP server based on the current theme
 * @param server - The MCP server metadata
 * @returns The appropriate logo URL based on light/dark theme
 */
export function useMcpServerLogo(server: OfficialMcpServerMeta | null | undefined): string | undefined {
	const [mounted, setMounted] = useState(false)
	const { theme, resolvedTheme } = useTheme()

	// Prevent hydration mismatch by only using theme after mount
	useEffect(() => {
		setMounted(true)
	}, [])

	if (!server) return undefined

	// During SSR or before mount, use fallback to avoid hydration mismatch
	if (!mounted) {
		return server.logoUrl || server.logoUrlLight || server.logoUrlDark
	}

	const currentTheme = resolvedTheme || theme || "light"
	
	// Check for theme-specific logos first
	if (currentTheme === "dark" && server.logoUrlDark) {
		return server.logoUrlDark
	}
	if (currentTheme === "light" && server.logoUrlLight) {
		return server.logoUrlLight
	}
	
	// Fallback to logoUrl for backward compatibility
	return server.logoUrl || server.logoUrlLight || server.logoUrlDark
}

/**
 * Utility function to get logo URL from server metadata (for non-hook contexts)
 * @param server - The MCP server metadata
 * @param theme - The current theme ("light" | "dark")
 * @returns The appropriate logo URL
 */
export function getMcpServerLogo(server: OfficialMcpServerMeta | null | undefined, theme: "light" | "dark" = "light"): string | undefined {
	if (!server) return undefined

	if (theme === "dark" && server.logoUrlDark) {
		return server.logoUrlDark
	}
	if (theme === "light" && server.logoUrlLight) {
		return server.logoUrlLight
	}

	return server.logoUrl || server.logoUrlLight || server.logoUrlDark
}

/**
 * Build a map of server names to their logo URLs based on theme
 * @param servers - Array of MCP server metadata
 * @param theme - The current theme ("light" | "dark")
 * @returns Record mapping server names to logo URLs
 */
export function buildLogoMap(servers: OfficialMcpServerMeta[], theme: "light" | "dark" = "light"): Record<string, string> {
	const logos: Record<string, string> = {}
	servers.forEach((s) => {
		const logoUrl = getMcpServerLogo(s, theme)
		if (logoUrl) {
			logos[s.serverName] = logoUrl
		}
	})
	return logos
}
