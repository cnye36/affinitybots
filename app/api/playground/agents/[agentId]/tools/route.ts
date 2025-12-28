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
		const enabledServers = agentConfig.enabled_mcp_servers || []

		// Load ALL tools from enabled servers (don't filter by selected_tools)
		const result = await mcpClientManager.createMcpClientAndTools({
			userId: user.id,
			enabledServers,
			forceRefresh: false,
		})

		// Transform tools to UI format
		const tools: Tool[] = result.tools.map((tool: any) => ({
			name: tool.name,
			displayName: tool.name.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
			description: tool.description || "No description available",
			serverName: tool.__serverName || "unknown",
			schema: tool.schema || {},
			category: tool.__serverName || "other",
		}))

		// Get server information
		const serverMap = new Map<string, ServerInfo>()

		// Process OAuth servers
		for (const [serverName, sessionId] of result.sessions.entries()) {
			const server = findOfficialServer(serverName)
			const serverTools = tools.filter(t => t.serverName === serverName)

			serverMap.set(serverName, {
				name: serverName,
				displayName: server?.displayName || serverName,
				toolCount: serverTools.length,
				isOAuth: true,
				isConnected: !!sessionId,
			})
		}

		// Process non-OAuth servers
		const allServerNames = new Set(tools.map(t => t.serverName))
		for (const serverName of allServerNames) {
			if (!serverMap.has(serverName)) {
				const server = findOfficialServer(serverName)
				const serverTools = tools.filter(t => t.serverName === serverName)

				serverMap.set(serverName, {
					name: serverName,
					displayName: server?.displayName || serverName,
					toolCount: serverTools.length,
					isOAuth: false,
					isConnected: true,
				})
			}
		}

		const servers = Array.from(serverMap.values())

		return NextResponse.json({
			tools,
			servers,
			totalTools: tools.length,
		})
	} catch (error) {
		console.error("Error fetching agent tools:", error)
		return NextResponse.json(
			{ error: "Failed to fetch tools" },
			{ status: 500 }
		)
	}
}
