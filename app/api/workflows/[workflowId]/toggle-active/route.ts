import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { canActivateWorkflow, incrementActiveWorkflowCount, decrementActiveWorkflowCount } from "@/lib/subscription/usage"
import { pauseSchedule, resumeSchedule } from "@/lib/scheduler/scheduler"

export async function POST(
	req: NextRequest,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	try {
		const { workflowId } = await params
		const supabase = await createClient()
		const adminSupabase = await getSupabaseAdmin()

		// Get current user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser()

		if (authError || !user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Get current workflow state
		const { data: workflow, error: fetchError } = await adminSupabase
			.from("workflows")
			.select("is_active, owner_id, workflow_type")
			.eq("workflow_id", workflowId)
			.single()

		if (fetchError || !workflow) {
			return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
		}

		// TypeScript guard: workflow is guaranteed to be defined here
		const wf = workflow as { is_active: boolean | null; owner_id: string; workflow_type: string | null }

		// Verify ownership
		if (wf.owner_id !== user.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 })
		}

		const currentlyActive = wf.is_active || false
		const newActiveState = !currentlyActive

		// If activating, check subscription limits
		if (newActiveState) {
			const usageCheck = await canActivateWorkflow(user.id)

			if (!usageCheck.allowed) {
				return NextResponse.json(
					{
						error: "Limit exceeded",
						message: usageCheck.reason,
						current: usageCheck.current,
						limit: usageCheck.limit,
						planType: usageCheck.planType,
					},
					{ status: 403 }
				)
			}
		}

		// Update workflow active status
		const { error: updateError } = await (adminSupabase
			.from("workflows") as any)
			.update({
				is_active: newActiveState,
				activated_at: newActiveState ? new Date().toISOString() : null,
			})
			.eq("workflow_id", workflowId)

		if (updateError) {
			throw updateError
		}

		// Update usage counts
		if (newActiveState) {
			await incrementActiveWorkflowCount(user.id)
		} else {
			await decrementActiveWorkflowCount(user.id)
		}

		// Pause or resume scheduled triggers
		const { data: scheduledTriggers } = await adminSupabase
			.from("workflow_triggers")
			.select("trigger_id")
			.eq("workflow_id", workflowId)
			.eq("trigger_type", "schedule")

		if (scheduledTriggers && scheduledTriggers.length > 0) {
			for (const trigger of scheduledTriggers) {
				try {
					const triggerId = (trigger as any).trigger_id
					if (newActiveState) {
						await resumeSchedule(triggerId)
					} else {
						await pauseSchedule(triggerId)
					}
				} catch (scheduleError) {
					console.error(`Failed to update schedule for trigger ${(trigger as any).trigger_id}:`, scheduleError)
					// Don't fail the request if schedule update fails
				}
			}
		}

		return NextResponse.json({
			success: true,
			is_active: newActiveState,
		})
	} catch (error) {
		console.error("Error toggling workflow active status:", error)
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		)
	}
}
