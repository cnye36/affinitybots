import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { findOfficialServer } from "@/lib/mcp/officialMcpServers"

interface ConfigureRequestBody {
	serverSlug: string
	apiKey: string
}

export async function POST(request: NextRequest) {
	try {
		const body: ConfigureRequestBody = await request.json()
		const { serverSlug, apiKey } = body

		if (!serverSlug || !apiKey) {
			return NextResponse.json(
				{ error: "Server slug and API key are required" },
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

		if (officialServer.authType !== "api_key") {
			return NextResponse.json(
				{ error: "This server does not use API key authentication" },
				{ status: 400 }
			)
		}

		// Store API key in user_mcp_servers table
		const { error: upsertError } = await supabase
			.from("user_mcp_servers")
			.upsert({
				user_id: user.id,
				server_slug: serverSlug,
				url: officialServer.url,
				config: {
					apiKey,
					authType: "api_key",
				},
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
