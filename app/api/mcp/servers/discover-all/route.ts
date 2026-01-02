import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { discoverMultipleServers } from "@/lib/mcp/mcpDiscovery"

/**
 * POST /api/mcp/servers/discover-all
 *
 * Discovers capabilities for all enabled MCP servers for the current user
 */
export async function POST(request: NextRequest) {
	try {
		const supabase = getSupabaseAdmin()

		// Get user ID from session
		const { data: sessionData } = await supabase.auth.getUser()
		if (!sessionData?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const userId = sessionData.user.id

		// Get all enabled MCP servers for this user
		const { data: servers, error: serversError } = await supabase
			.from("user_mcp_servers")
			.select("*")
			.eq("user_id", userId)
			.eq("is_enabled", true)

		if (serversError) {
			console.error("Error fetching servers:", serversError)
			return NextResponse.json(
				{ error: "Failed to fetch servers" },
				{ status: 500 }
			)
		}

		if (!servers || servers.length === 0) {
			return NextResponse.json({
				message: "No enabled servers found",
				discovered: [],
			})
		}

		console.log(`Discovering capabilities for ${servers.length} servers...`)

		// Prepare server list for batch discovery
		const serverList = (servers as any[]).map((server) => ({
			qualifiedName: server.server_slug || server.qualified_name,
			url: server.url,
			sessionId: server.session_id,
			apiKey: server.config?.apiKey || server.config?.api_key,
			bearerToken: server.oauth_token || server.config?.bearer_token,
		}))

		// Discover capabilities for all servers in parallel
		const capabilities = await discoverMultipleServers(serverList)

		console.log(`Discovered capabilities for ${capabilities.length} servers`)

		// Store all capabilities in the database
		const upsertPromises = capabilities.map((cap) =>
			supabase.from("mcp_server_capabilities").upsert(
				{
					user_id: userId,
					server_slug: cap.qualifiedName,
					tools: cap.tools,
					resources: cap.resources,
					prompts: cap.prompts,
					server_info: cap.serverInfo,
					discovered_at: new Date().toISOString(),
				} as any,
				{
					onConflict: "user_id,server_slug",
				}
			)
		)

		await Promise.allSettled(upsertPromises)

		// Calculate summary statistics
		const summary = {
			totalServers: capabilities.length,
			totalTools: capabilities.reduce((sum, cap) => sum + cap.tools.length, 0),
			totalResources: capabilities.reduce(
				(sum, cap) => sum + cap.resources.length,
				0
			),
			totalPrompts: capabilities.reduce((sum, cap) => sum + cap.prompts.length, 0),
			serversWithTools: capabilities.filter((cap) => cap.tools.length > 0).length,
			serversWithResources: capabilities.filter((cap) => cap.resources.length > 0)
				.length,
			serversWithPrompts: capabilities.filter((cap) => cap.prompts.length > 0)
				.length,
		}

		return NextResponse.json({
			success: true,
			summary,
			discovered: capabilities.map((cap) => ({
				qualifiedName: cap.qualifiedName,
				toolCount: cap.tools.length,
				resourceCount: cap.resources.length,
				promptCount: cap.prompts.length,
			})),
		})
	} catch (error) {
		console.error("Error discovering all server capabilities:", error)
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		)
	}
}

/**
 * GET /api/mcp/servers/discover-all
 *
 * Gets all stored capabilities for the current user's enabled servers
 */
export async function GET(request: NextRequest) {
	try {
		const supabase = getSupabaseAdmin()

		// Get user ID from session
		const { data: sessionData } = await supabase.auth.getUser()
		if (!sessionData?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const userId = sessionData.user.id

		// Get all stored capabilities
		const { data: capabilities, error } = await supabase
			.from("mcp_server_capabilities")
			.select("*")
			.eq("user_id", userId)
			.order("discovered_at", { ascending: false })

		if (error) {
			console.error("Error fetching capabilities:", error)
			return NextResponse.json(
				{ error: "Failed to fetch capabilities" },
				{ status: 500 }
			)
		}

		// Format response
		const formattedCapabilities = (capabilities as any[]).map((cap) => ({
			qualifiedName: cap.server_slug || cap.qualified_name,
			tools: cap.tools || [],
			resources: cap.resources || [],
			prompts: cap.prompts || [],
			serverInfo: cap.server_info,
			discoveredAt: cap.discovered_at,
			toolCount: (cap.tools || []).length,
			resourceCount: (cap.resources || []).length,
			promptCount: (cap.prompts || []).length,
		}))

		return NextResponse.json({
			capabilities: formattedCapabilities,
			totalServers: formattedCapabilities.length,
		})
	} catch (error) {
		console.error("Error fetching all server capabilities:", error)
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 }
		)
	}
}
