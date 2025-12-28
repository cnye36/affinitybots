import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"

export async function POST(request: NextRequest) {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await request.json()
		const { name, mode = "sequential", orchestrator_config } = body

		const { data: session, error } = await supabase
			.from("playground_sessions")
			.insert({
				user_id: user.id,
				name,
				mode,
				orchestrator_config,
			})
			.select()
			.single()

		if (error) {
			console.error("Error creating session:", error)
			return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
		}

		return NextResponse.json(session)
	} catch (error) {
		console.error("Error in POST /api/playground/sessions:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function GET(request: NextRequest) {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { data: sessions, error } = await supabase
			.from("playground_sessions")
			.select("*")
			.eq("user_id", user.id)
			.order("last_activity_at", { ascending: false })

		if (error) {
			console.error("Error fetching sessions:", error)
			return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
		}

		return NextResponse.json(sessions)
	} catch (error) {
		console.error("Error in GET /api/playground/sessions:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
