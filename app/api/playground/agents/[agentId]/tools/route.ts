import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { mcpClientManager } from "@/lib/mcp/mcpClientManager"
import { findOfficialServer } from "@/lib/mcp/officialMcpServers"
import { Tool, ServerInfo } from "@/types/playground"

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ agentId: string }> }
) {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { agentId } = await params

		// Check if enabled servers are provided as query parameter (for immediate updates)
		const { searchParams } = new URL(request.url)
		const enabledServersParam = searchParams.get("enabledServers")
		let enabledServers: string[] = []

		if (enabledServersParam) {
			// Use provided enabled servers (for immediate UI updates)
			try {
				enabledServers = JSON.parse(enabledServersParam)
			} catch (e) {
				console.warn("Failed to parse enabledServers query param:", e)
			}
		}

		// If no query param, get from saved config
		if (enabledServers.length === 0) {
			// Get agent configuration from LangGraph Platform
			const platformUrl = process.env.LANGGRAPH_API_URL || "http://localhost:8123"
			const response = await fetch(`${platformUrl}/assistants/${agentId}`, {
				headers: {
					"X-Api-Key": process.env.LANGSMITH_API_KEY || "",
				},
			})

			if (!response.ok) {
				return NextResponse.json(
					{ error: "Failed to fetch assistant configuration" },
					{ status: 500 }
				)
			}

			const assistant = await response.json()
			const agentConfig = assistant.config?.configurable || {}

			// Get enabled MCP servers for this agent
			enabledServers = agentConfig.enabled_mcp_servers || []
		}

		// Verify which servers are actually configured and enabled
		const { data: userServers } = await supabase
			.from("user_mcp_servers")
			.select("server_slug, is_enabled")
			.eq("user_id", user.id)
			.eq("is_enabled", true)
		
		const { data: userAddedServers } = await supabase
			.from("user_added_servers")
			.select("server_slug, is_enabled")
			.eq("user_id", user.id)
			.eq("is_enabled", true)
		
		const configuredServerSlugs = new Set([
			...(userServers || []).map((s: any) => s.server_slug),
			...(userAddedServers || []).map((s: any) => s.server_slug),
		])
		
		// Filter enabled servers to only include those that are actually configured
		const validEnabledServers = enabledServers.filter(serverName => 
			configuredServerSlugs.has(serverName)
		)
		
		if (validEnabledServers.length === 0) {
			return NextResponse.json({
				tools: [],
				servers: [],
				totalTools: 0,
			})
		}

		// Load ALL tools from enabled servers (don't filter by selected_tools)
		const result = await mcpClientManager.createMcpClientAndTools({
			userId: user.id,
			enabledServers: validEnabledServers,
			forceRefresh: false,
		})

		// Create a map of server names to their tools for proper attribution
		// OAuth clients have their tools tagged with serverName
		const serverToolMap = new Map<string, any[]>()
		
		// Group tools by their server name
		for (const tool of result.tools) {
			const serverName = tool.__serverName
			if (serverName && serverName !== "unknown") {
				if (!serverToolMap.has(serverName)) {
					serverToolMap.set(serverName, [])
				}
				serverToolMap.get(serverName)!.push(tool)
			}
		}
		
		// For OAuth servers, we know which tools belong to which server
		// For non-OAuth servers (MultiServerMCPClient), tools should already be tagged
		// But we need to verify they match enabled servers
		const oauthServerNames = Array.from(result.oauthClients.keys())
		
		// Create a map to track which tools belong to which server
		// OAuth tools are already tagged, but MultiServerMCPClient tools might not be
		const serverToolCounts = new Map<string, number>()
		for (const serverName of validEnabledServers) {
			serverToolCounts.set(serverName, 0)
		}
		
		// First pass: count tools that are already properly tagged
		for (const tool of result.tools) {
			const serverName = tool.__serverName
			if (serverName && serverName !== "unknown" && validEnabledServers.includes(serverName)) {
				serverToolCounts.set(serverName, (serverToolCounts.get(serverName) || 0) + 1)
			}
		}
		
		// Transform tools to UI format with proper server attribution
		const tools: Tool[] = result.tools.map((tool: any) => {
			let serverName = tool.__serverName
			
			// Normalize server name to match official server names
			if (serverName && serverName !== "unknown") {
				const officialServer = findOfficialServer(serverName)
				if (officialServer) {
					serverName = officialServer.serverName
				} else {
					// Try case-insensitive matching with enabled servers
					const normalized = validEnabledServers.find(s => 
						s.toLowerCase() === serverName.toLowerCase()
					)
					if (normalized) {
						serverName = normalized
					} else if (!validEnabledServers.includes(serverName)) {
						// Server name doesn't match any enabled server - mark as unknown
						serverName = "unknown"
					}
				}
			} else {
				// Tool has no server name - mark as unknown
				// We'll filter these out to prevent misattribution
				serverName = "unknown"
			}
			
			return {
				name: tool.name,
				displayName: tool.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
				description: tool.description || "No description available",
				serverName: serverName || "unknown",
				schema: tool.schema || {},
				category: serverName || "other",
			}
		})
		
		// Filter out tools with unknown server names - they can't be properly attributed
		// This prevents tools from being misattributed to wrong servers
		const validTools = tools.filter(t => {
			if (t.serverName === "unknown") {
				console.warn(`Tool ${t.name} has unknown server name - filtering out to prevent misattribution`)
				return false
			}
			// Also verify the server is in the valid enabled servers list
			return validEnabledServers.includes(t.serverName)
		})

		// Get server information - only for servers that have tools and are in enabled list
		const serverMap = new Map<string, ServerInfo>()
		
		// Only create server entries for servers that:
		// 1. Are in the validEnabledServers list
		// 2. Have tools associated with them
		// 3. Are actually configured
		for (const serverName of validEnabledServers) {
			if (!configuredServerSlugs.has(serverName)) {
				continue // Skip if not configured
			}
			
			const serverTools = validTools.filter(t => t.serverName === serverName)
			if (serverTools.length === 0) {
				continue // Skip if no tools
			}
			
			const server = findOfficialServer(serverName)
			const sessionId = result.sessions.get(serverName)
			const isOAuth = result.oauthClients.has(serverName) || !!sessionId

			serverMap.set(serverName, {
				name: serverName,
				displayName: server?.displayName || serverName,
				toolCount: serverTools.length,
				isOAuth: isOAuth,
				isConnected: isOAuth ? !!sessionId : true,
			})
		}

		const servers = Array.from(serverMap.values())

		return NextResponse.json({
			tools: validTools,
			servers,
			totalTools: validTools.length,
		})
	} catch (error) {
		console.error("Error fetching agent tools:", error)
		return NextResponse.json(
			{ error: "Failed to fetch tools" },
			{ status: 500 }
		)
	}
}
