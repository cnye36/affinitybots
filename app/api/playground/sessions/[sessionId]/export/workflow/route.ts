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
		const { workflowName, workflowDescription, triggerType = "manual" } = body

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

		// Create workflow
		const { data: workflow, error: workflowError } = await supabase
			.from("workflows")
			.insert({
				name: workflowName,
				description: workflowDescription,
				owner_id: user.id,
				workflow_type: session.mode,
				orchestrator_config: session.orchestrator_config,
				status: "draft",
				is_active: false,
			})
			.select()
			.single()

		if (workflowError) {
			console.error("Error creating workflow:", workflowError)
			return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 })
		}

		// Create trigger
		const { data: trigger } = await supabase
			.from("workflow_triggers")
			.insert({
				workflow_id: workflow.workflow_id,
				trigger_type: triggerType,
				name: `${workflowName} Trigger`,
				config: {},
			})
			.select()
			.single()

		// Create tasks from steps
		if (steps && steps.length > 0) {
			const tasks = steps.map((step, index) => ({
				workflow_id: workflow.workflow_id,
				name: step.agent_name || `Task ${index + 1}`,
				description: step.user_prompt || "From playground",
				task_type: "ai_task",
				assistant_id: step.agent_id,
				owner_id: user.id,
				position: index,
				config: {
					input: {
						source: "previous_output",
						parameters: {},
						prompt: step.user_prompt || "",
					},
					output: {
						destination: "next_task",
						format: "text",
					},
					context: {
						thread: { mode: "workflow" },
						inputSource: "prompt_and_previous_output",
					},
					toolApproval: {
						mode: step.tool_approval_mode || "auto",
					},
					selected_tools: step.selected_tools || [],
				},
				status: "pending",
			}))

			const { error: tasksError } = await supabase
				.from("workflow_tasks")
				.insert(tasks)

			if (tasksError) {
				console.error("Error creating tasks:", tasksError)
			}
		}

		return NextResponse.json({ workflow_id: workflow.workflow_id })
	} catch (error) {
		console.error("Error in workflow export:", error)
		return NextResponse.json({ error: "Internal server error" }, { status: 500 })
	}
}
