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
		const { name, description, category, is_public = false } = body

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

		// Build template config
		const templateConfig = {
			mode: session.mode,
			orchestrator_config: session.orchestrator_config,
			steps: (steps || []).map((step) => ({
				agent_role: step.agent_name,
				agent_description: step.user_prompt || "Agent task",
				selected_tools: step.selected_tools || [],
				prompt_template: step.user_prompt || "",
				tool_approval_mode: step.tool_approval_mode || "auto",
			})),
		}

		// Create template
		const { data: template, error } = await supabase
			.from("playground_templates")
			.insert({
				user_id: user.id,
				name,
				description,
				category,
				is_public,
				template_config: templateConfig,
			})
			.select()
			.single()

		if (error) {
			console.error("Error creating template:", error)
			return NextResponse.json({ error: "Failed to create template" }, { status: 500 })
		}

		return NextResponse.json({ template_id: template.template_id })
	} catch (error) {
		console.error("Error in template export:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
