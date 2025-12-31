import { NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { Client } from "@langchain/langgraph-sdk"

/**
 * Cancel a stuck workflow run
 * Marks the run as failed and attempts to cancel any active LangGraph execution
 */
export async function POST(
	request: Request,
	props: { params: Promise<{ workflowId: string; runId: string }> }
) {
	const { workflowId, runId } = await props.params
	const supabase = await createClient()

	try {
		const {
			data: { user },
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Verify workflow ownership
		const { data: workflow } = await supabase
			.from("workflows")
			.select("owner_id")
			.eq("workflow_id", workflowId)
			.single()

		if (!workflow || workflow.owner_id !== user.id) {
			return NextResponse.json(
				{ error: "Workflow not found or access denied" },
				{ status: 404 }
			)
		}

		// Get the workflow run
		const { data: workflowRun, error: runError } = await supabase
			.from("workflow_runs")
			.select("run_id, status, metadata, thread_id")
			.eq("run_id", runId)
			.eq("workflow_id", workflowId)
			.single()

		if (runError || !workflowRun) {
			return NextResponse.json(
				{ error: "Workflow run not found" },
				{ status: 404 }
			)
		}

		// Only cancel if it's actually running
		if (workflowRun.status !== "running") {
			return NextResponse.json(
				{ error: `Workflow run is not running (status: ${workflowRun.status})` },
				{ status: 400 }
			)
		}

		// Attempt to cancel LangGraph run if we have metadata
		const metadata = (workflowRun.metadata || {}) as Record<string, unknown>
		const langgraphRunId = metadata.langgraph_run_id as string | undefined
		const threadId = workflowRun.thread_id as string | undefined

		if (langgraphRunId || threadId) {
			try {
				const client = new Client({
					apiUrl: process.env.LANGGRAPH_API_URL,
					apiKey: process.env.LANGSMITH_API_KEY,
				})

				// Try to cancel the run if we have a run_id
				if (langgraphRunId) {
					try {
						await client.runs.cancel(langgraphRunId)
					} catch (e) {
						console.warn("Failed to cancel LangGraph run (may already be completed):", e)
					}
				}
			} catch (e) {
				console.warn("Error attempting to cancel LangGraph run:", e)
				// Continue anyway - we'll still mark it as failed in the DB
			}
		}

		// Mark workflow run as failed
		const { error: updateError } = await supabase
			.from("workflow_runs")
			.update({
				status: "failed",
				completed_at: new Date().toISOString(),
				error: "Cancelled by user - workflow was stuck in running state",
			})
			.eq("run_id", runId)

		if (updateError) {
			console.error("Failed to update workflow run:", updateError)
			return NextResponse.json(
				{ error: "Failed to cancel workflow run" },
				{ status: 500 }
			)
		}

		// Also mark any associated task runs as failed
		const { data: taskRuns } = await supabase
			.from("workflow_task_runs")
			.select("run_id")
			.eq("workflow_run_id", runId)
			.eq("status", "running")

		if (taskRuns && taskRuns.length > 0) {
			await supabase
				.from("workflow_task_runs")
				.update({
					status: "failed",
					completed_at: new Date().toISOString(),
					error: "Cancelled - parent workflow run was cancelled",
				})
				.in(
					"run_id",
					taskRuns.map((tr) => tr.run_id)
				)
		}

		return NextResponse.json({
			success: true,
			message: "Workflow run cancelled successfully",
		})
	} catch (error) {
		console.error("Error cancelling workflow run:", error)
		return NextResponse.json(
			{ error: "Failed to cancel workflow run" },
			{ status: 500 }
		)
	}
}

