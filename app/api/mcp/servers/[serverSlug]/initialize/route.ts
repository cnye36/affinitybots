import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { discoverServerCapabilities } from "@/lib/mcp/mcpDiscovery"
import { findOfficialServer } from "@/lib/mcp/officialMcpServers"

/**
 * POST /api/mcp/servers/[serverSlug]/initialize
 *
 * Initializes an official MCP server by discovering its capabilities
 * and storing them in the global_server_capabilities table.
 * This allows all users to see capabilities before connecting.
 */
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ serverSlug: string }> }
) {
	try {
		const { serverSlug } = await params
		const supabase = getSupabaseAdmin()

		// Get the official server definition
		const officialServer = findOfficialServer(serverSlug)
		if (!officialServer) {
			return NextResponse.json(
				{ error: "Server not found in official servers list" },
				{ status: 404 }
			)
		}

		console.log(`Initializing server ${serverSlug} at ${officialServer.url}...`)

		// Discover server capabilities
		// For OAuth servers, try without auth first (some servers may allow it)
		// For API key servers, we can't discover without a key, so we'll return empty
		const capabilities = await discoverServerCapabilities(
			officialServer.url,
			serverSlug,
			{
				// No sessionId, apiKey, or bearerToken - try unauthenticated discovery
			}
		)

		console.log(
			`Discovered ${capabilities.tools.length} tools, ${capabilities.resources.length} resources, ${capabilities.prompts.length} prompts for ${serverSlug}`
		)

		// Store capabilities in the global table
		const { error: upsertError } = await supabase
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

		if (upsertError) {
			console.error("Error storing global capabilities:", upsertError)
			return NextResponse.json(
				{ error: "Failed to store capabilities" },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			capabilities,
			message: `Successfully initialized ${serverSlug}`,
		})
	} catch (error) {
		console.error("Error initializing server capabilities:", error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal server error" },
			{ status: 500 }
		)
	}
}

/**
 * GET /api/mcp/servers/[serverSlug]/initialize
 *
 * Retrieves the global capabilities for an official server
 * Public endpoint - all users can access global capabilities
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ serverSlug: string }> }
) {
	try {
		const { serverSlug } = await params
		// Use admin client to bypass RLS for global capabilities (they're public info)
		const supabase = getSupabaseAdmin()

		// Get stored global capabilities
		const { data: capabilities, error } = await supabase
			.from("global_server_capabilities")
			.select("*")
			.eq("server_slug", serverSlug)
			.single()

		if (error && error.code !== "PGRST116") {
			// PGRST116 = not found
			console.error("Error fetching global capabilities:", error)
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

		return NextResponse.json({
			tools: (capabilities as any).tools || [],
			resources: (capabilities as any).resources || [],
			prompts: (capabilities as any).prompts || [],
			server_info: (capabilities as any).server_info,
			discovered_at: (capabilities as any).discovered_at,
		})
	} catch (error) {
		console.error("Error fetching global server capabilities:", error)
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Internal server error" },
			{ status: 500 }
		)
	}
}
