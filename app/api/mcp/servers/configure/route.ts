import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { findOfficialServer } from "@/lib/mcp/officialMcpServers"

interface ConfigureRequestBody {
	serverSlug: string
	apiKey?: string // Optional - only required for api_key authType
	config?: Record<string, string> // Additional configuration fields (e.g., domain, projectId)
}

export async function POST(request: NextRequest) {
	try {
		const body: ConfigureRequestBody = await request.json()
		const { serverSlug, apiKey, config = {} } = body

		if (!serverSlug) {
			return NextResponse.json(
				{ error: "Server slug is required" },
				{ status: 400 }
			)
		}

		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const officialServer = findOfficialServer(serverSlug)
		if (!officialServer) {
			return NextResponse.json(
				{ error: "Server not found" },
				{ status: 404 }
			)
		}

		if (officialServer.authType !== "api_key" && officialServer.authType !== "none") {
			return NextResponse.json(
				{ error: "This server does not use API key or config-only authentication" },
				{ status: 400 }
			)
		}

		// API key is required for api_key authType
		if (officialServer.authType === "api_key" && (!apiKey || !apiKey.trim())) {
			return NextResponse.json(
				{ error: "API key is required for this server" },
				{ status: 400 }
			)
		}

		// Validate required config fields
		if (officialServer.configFields) {
			for (const field of officialServer.configFields) {
				if (field.required && !config[field.key]?.trim()) {
					return NextResponse.json(
						{ error: `${field.label} is required` },
						{ status: 400 }
					)
				}
			}
		}

		// Build the final URL by replacing placeholders with config values and API key
		let finalUrl = officialServer.url
		
		// Replace API key placeholder if present in URL (for servers like Tavily that need it in query string)
		if (apiKey && finalUrl.includes("{apiKey}")) {
			finalUrl = finalUrl.replace(/\{apiKey\}/gi, encodeURIComponent(apiKey))
		}
		
		// Replace other config field placeholders
		if (config && Object.keys(config).length > 0) {
			for (const [key, value] of Object.entries(config)) {
				// Replace {key} or {KEY} placeholders in URL
				finalUrl = finalUrl.replace(new RegExp(`\\{${key}\\}`, "gi"), encodeURIComponent(value))
			}
		}

		// Store config in user_mcp_servers table
		const configToStore: Record<string, any> = {
			authType: officialServer.authType,
			...config, // Include additional config fields
		}
		
		// Only include API key if it was provided
		if (apiKey) {
			configToStore.apiKey = apiKey
			
			// Special handling for Oktopost: store API token in config for custom headers
			if (serverSlug === "oktopost") {
				configToStore.apiToken = apiKey
			}
		}
		
		// Store custom API key header name if specified
		if (officialServer.apiKeyHeaderName) {
			configToStore.apiKeyHeaderName = officialServer.apiKeyHeaderName
		}

		const { error: upsertError } = await supabase
			.from("user_mcp_servers")
			.upsert({
				user_id: user.id,
				server_slug: serverSlug,
				url: finalUrl,
				config: configToStore,
				is_enabled: true,
				updated_at: new Date().toISOString(),
			}, {
				onConflict: "user_id,server_slug"
			})

		if (upsertError) {
			console.error("Failed to store API key configuration:", upsertError)
			return NextResponse.json(
				{ error: "Failed to save configuration" },
				{ status: 500 }
			)
		}

		return NextResponse.json({ success: true })
	} catch (error: unknown) {
		console.error("Configure server error:", error)
		if (error instanceof Error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}
		return NextResponse.json({ error: String(error) }, { status: 500 })
	}
}
