"use client"

import Image from "next/image"
import { useMcpServerLogo } from "@/lib/utils/mcpServerLogo"
import type { OfficialMcpServerMeta } from "@/lib/mcp/officialMcpServers"

interface McpServerLogoProps {
	server: OfficialMcpServerMeta | null | undefined
	serverName?: string
	alt?: string
	width?: number
	height?: number
	className?: string
	style?: React.CSSProperties
	fallback?: React.ReactNode
}

export function McpServerLogo({
	server: serverProp,
	serverName,
	alt,
	width = 24,
	height = 24,
	className = "",
	style,
	fallback,
}: McpServerLogoProps) {
	// If serverName is provided but server is not, find it
	const server =
		serverProp ||
		(serverName
			? require("@/lib/mcp/officialMcpServers").OFFICIAL_MCP_SERVERS.find(
					(s: OfficialMcpServerMeta) => s.serverName === serverName
			  )
			: null)

	const logoUrl = useMcpServerLogo(server)

	if (!logoUrl) {
		if (fallback) return <>{fallback}</>
		return null
	}

	return (
		<Image
			src={logoUrl}
			alt={alt || server?.displayName || serverName || "MCP Server"}
			width={width}
			height={height}
			className={`object-contain ${className}`}
			style={{ ...style, maxWidth: `${width}px`, maxHeight: `${height}px`, width: 'auto', height: 'auto' }}
		/>
	)
}
