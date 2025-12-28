import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { sessionId } = await params

		const { data: session, error } = await supabase
			.from("playground_sessions")
			.select("*")
			.eq("session_id", sessionId)
			.eq("user_id", user.id)
			.single()

		if (error) {
			console.error("Error fetching session:", error)
			return NextResponse.json({ error: "Session not found" }, { status: 404 })
		}

		return NextResponse.json(session)
	} catch (error) {
		console.error("Error in GET /api/playground/sessions/[sessionId]:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { sessionId } = await params

		const body = await request.json()
		const updates = {
			...body,
			updated_at: new Date().toISOString(),
			last_activity_at: new Date().toISOString(),
		}

		const { data: session, error } = await supabase
			.from("playground_sessions")
			.update(updates)
			.eq("session_id", sessionId)
			.eq("user_id", user.id)
			.select()
			.single()

		if (error) {
			console.error("Error updating session:", error)
			return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
		}

		return NextResponse.json(session)
	} catch (error) {
		console.error("Error in PATCH /api/playground/sessions/[sessionId]:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> }
) {
	try {
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { sessionId } = await params

		const { error } = await supabase
			.from("playground_sessions")
			.delete()
			.eq("session_id", sessionId)
			.eq("user_id", user.id)

		if (error) {
			console.error("Error deleting session:", error)
			return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error("Error in DELETE /api/playground/sessions/[sessionId]:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
