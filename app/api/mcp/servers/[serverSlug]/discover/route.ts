import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { discoverServerCapabilities } from "@/lib/mcp/mcpDiscovery"
import { findOfficialServer } from "@/lib/mcp/officialMcpServers"

/**
 * POST /api/mcp/servers/[serverSlug]/discover
 *
 * Discovers and stores the capabilities (tools, resources, prompts) of an MCP server
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ serverSlug: string }> }
) {
	try {
		const { serverSlug } = await params
		const supabase = await createClient()

		// Get user ID from session
		const { data: sessionData } = await supabase.auth.getUser()
		if (!sessionData?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const userId = sessionData.user.id

		// Get the user's MCP server configuration
		const { data: serverConfig, error: configError } = await supabase
			.from("user_mcp_servers")
			.select("*")
			.eq("user_id", userId)
			.eq("server_slug", serverSlug)
			.single()

		if (configError || !serverConfig) {
			return NextResponse.json(
				{ error: "Server not found or not enabled" },
				{ status: 404 }
			)
		}

		// TypeScript guard: serverConfig is guaranteed to be defined here
		const config = serverConfig as { url: string; session_id?: string | null; oauth_token?: string | null; config?: any }
		
		if (!config.url) {
			return NextResponse.json(
				{ error: "Server URL not configured" },
				{ status: 400 }
			)
		}

		console.log(`Discovering capabilities for ${serverSlug}...`)

		// Discover server capabilities
		const capabilities = await discoverServerCapabilities(
			config.url,
			serverSlug,
			{
				sessionId: config.session_id || undefined,
				apiKey: config.config?.apiKey || config.config?.api_key || undefined,
				bearerToken: config.oauth_token || config.config?.bearer_token || undefined,
			}
		)

		console.log(
			`Discovered ${capabilities.tools.length} tools, ${capabilities.resources.length} resources, ${capabilities.prompts.length} prompts`
		)

		// Store capabilities in the database
		const { error: upsertError } = await supabase
			.from("mcp_server_capabilities")
			.upsert(
				{
					user_id: userId,
					server_slug: serverSlug,
					tools: capabilities.tools,
					resources: capabilities.resources,
					prompts: capabilities.prompts,
					server_info: capabilities.serverInfo,
					discovered_at: new Date().toISOString(),
				} as any,
				{
					onConflict: "user_id,server_slug",
				}
			)

		if (upsertError) {
			console.error("Error storing capabilities:", upsertError)
			return NextResponse.json(
				{ error: "Failed to store capabilities" },
				{ status: 500 }
			)
		}

		// Also update global cache if this is an official server and we got capabilities
		const officialServer = findOfficialServer(serverSlug)
		if (officialServer && (capabilities.tools.length > 0 || capabilities.resources.length > 0 || capabilities.prompts.length > 0)) {
			try {
				const adminSupabase = getSupabaseAdmin()
				await adminSupabase
					.from("global_server_capabilities")
					.upsert(
						{
							server_slug: serverSlug,
							tools: capabilities.tools,
							resources: capabilities.resources,
							prompts: capabilities.prompts,
							server_info: capabilities.serverInfo,
							discovered_at: new Date().toISOString(),
						} as any,
						{
							onConflict: "server_slug",
						}
					)
				console.log(`Updated global capabilities cache for ${serverSlug}`)
			} catch (globalError) {
				// Don't fail the request if global update fails
				console.warn(`Failed to update global cache for ${serverSlug}:`, globalError)
			}
		}

		return NextResponse.json({
			success: true,
			capabilities,
		})
	} catch (error) {
		console.error("Error discovering server capabilities:", error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal server error" },
			{ status: 500 }
		)
	}
}

/**
 * GET /api/mcp/servers/[serverSlug]/discover
 *
 * Retrieves the stored capabilities for an MCP server
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ serverSlug: string }> }
) {
	try {
		const { serverSlug } = await params
		const supabase = await createClient()

		// Get user ID from session
		const { data: sessionData } = await supabase.auth.getUser()
		if (!sessionData?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const userId = sessionData.user.id

		// Get stored capabilities
		const { data: capabilities, error } = await supabase
			.from("mcp_server_capabilities")
			.select("*")
			.eq("user_id", userId)
			.eq("server_slug", serverSlug)
			.single()

		if (error && error.code !== "PGRST116") {
			// PGRST116 = not found
			console.error("Error fetching capabilities:", error)
			return NextResponse.json(
				{ error: "Failed to fetch capabilities" },
				{ status: 500 }
			)
		}

		if (!capabilities) {
			return NextResponse.json(
				{
					tools: [],
					resources: [],
					prompts: [],
					discovered_at: null,
				},
				{ status: 200 }
			)
		}

		const caps = capabilities as any
		return NextResponse.json({
			tools: caps.tools || [],
			resources: caps.resources || [],
			prompts: caps.prompts || [],
			server_info: caps.server_info,
			discovered_at: caps.discovered_at,
		})
	} catch (error) {
		console.error("Error fetching server capabilities:", error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal server error" },
			{ status: 500 }
		)
	}
}
