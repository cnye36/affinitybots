import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"

export async function POST(
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
		const {
			agentId,
			agentName,
			selectedTools,
			userPrompt,
			previousContext,
			toolApprovalMode = "auto",
			step_number,
		} = body

		// Create step record
		const { data: step, error } = await supabase
			.from("playground_steps")
			.insert({
				session_id: sessionId,
				user_id: user.id,
				step_number,
				agent_id: agentId,
				agent_name: agentName,
				selected_tools: selectedTools,
				tool_approval_mode: toolApprovalMode,
				user_prompt: userPrompt,
				previous_context: previousContext,
				status: "pending",
			})
			.select()
			.single()

		if (error) {
			console.error("Error creating step:", error)
			return NextResponse.json({ error: "Failed to create step" }, { status: 500 })
		}

		// Update session last_activity_at
		await supabase
			.from("playground_sessions")
			.update({ last_activity_at: new Date().toISOString() })
			.eq("session_id", sessionId)

		return NextResponse.json(step)
	} catch (error) {
		console.error("Error in POST /api/playground/sessions/[sessionId]/steps:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}

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

		const { data: steps, error } = await supabase
			.from("playground_steps")
			.select("*")
			.eq("session_id", sessionId)
			.eq("user_id", user.id)
			.order("step_number", { ascending: true })

		if (error) {
			console.error("Error fetching steps:", error)
			return NextResponse.json({ error: "Failed to fetch steps" }, { status: 500 })
		}

		return NextResponse.json(steps)
	} catch (error) {
		console.error("Error in GET /api/playground/sessions/[sessionId]/steps:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
