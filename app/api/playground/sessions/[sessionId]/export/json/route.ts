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

		// Get session and steps
		const { data: session } = await supabase
			.from("playground_sessions")
			.select("*")
			.eq("session_id", sessionId)
			.eq("user_id", user.id)
			.single()

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 })
		}

		const { data: steps } = await supabase
			.from("playground_steps")
			.select("*")
			.eq("session_id", sessionId)
			.eq("user_id", user.id)
			.order("step_number", { ascending: true })

		// Build JSON export
		const exportData = {
			version: "1.0",
			export_date: new Date().toISOString(),
			session: {
				name: session.name,
				description: session.description,
				mode: session.mode,
				orchestrator_config: session.orchestrator_config,
			},
			steps: (steps || []).map((step) => ({
				step_number: step.step_number,
				agent: {
					id: step.agent_id,
					name: step.agent_name,
				},
				selected_tools: step.selected_tools || [],
				user_prompt: step.user_prompt,
				output: step.output,
				metadata: {
					started_at: step.started_at,
					completed_at: step.completed_at,
					status: step.status,
				},
			})),
			import_instructions: {
				required_agents: [...new Set((steps || []).map((s) => s.agent_id))],
				required_tools: [
					...new Set((steps || []).flatMap((s) => s.selected_tools || [])),
				],
			},
		}

		return NextResponse.json(exportData)
	} catch (error) {
		console.error("Error in JSON export:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
