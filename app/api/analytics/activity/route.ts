import { NextResponse } from "next/server"
import { createClient } from "@/supabase/server"

type ActivityType = "workflow" | "task"

type ActivityItem = {
	type: ActivityType
	id: string
	workflow_id: string | null
	workflow_name: string | null
	task_id?: string | null
	task_name?: string | null
	assistant_id?: string | null
	assistant_name?: string | null
	status: string | null
	started_at: string | null
	completed_at: string | null
	duration_ms: number | null
	error?: string | null
}

export async function GET(request: Request) {
	const supabase = await createClient()
	const {
		data: { user },
	} = await supabase.auth.getUser()
	if (!user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const url = new URL(request.url)
	const start = url.searchParams.get("start")
	const end = url.searchParams.get("end")
	const workflowId = url.searchParams.get("workflowId")
	const agentId = url.searchParams.get("agentId")
	const status = url.searchParams.get("status")
	const type = url.searchParams.get("type") as ActivityType | "all" | null
	const limit = Math.min(Number(url.searchParams.get("limit") || 200), 500)

	const { data: workflows, error: workflowsError } = await supabase
		.from("workflows")
		.select("workflow_id, name")
		.eq("owner_id", user.id)
	if (workflowsError) {
		console.error("Failed to load workflows for analytics:", workflowsError)
		return NextResponse.json({ error: "Failed to load workflows" }, { status: 500 })
	}

	const workflowIds = (workflows || []).map((workflow) => workflow.workflow_id)

	const { data: assistantsData, error: assistantsError } = await supabase
		.from("assistant")
		.select("assistant_id, name, user_assistants!inner(user_id)")
		.eq("user_assistants.user_id", user.id)
	if (assistantsError) {
		console.error("Failed to load assistants for analytics:", assistantsError)
		return NextResponse.json({ error: "Failed to load assistants" }, { status: 500 })
	}

	const assistants = (assistantsData || []).map((assistant: any) => ({
		assistant_id: assistant.assistant_id as string,
		name: assistant.name || "Unnamed Agent",
	}))
	if (workflowIds.length === 0) {
		return NextResponse.json({
			items: [],
			filters: { workflows: workflows || [], agents: assistants },
		})
	}

	const workflowsById = new Map(
		(workflows || []).map((workflow) => [workflow.workflow_id, workflow.name])
	)
	const assistantsById = new Map(
		assistants.map((assistant) => [assistant.assistant_id, assistant.name])
	)

	let workflowRuns: any[] = []
	if (type !== "task") {
		let workflowRunQuery = supabase
			.from("workflow_runs")
			.select("run_id, workflow_id, status, started_at, completed_at, error")
			.in("workflow_id", workflowIds)
			.order("started_at", { ascending: false })
			.limit(limit)

		if (workflowId) workflowRunQuery = workflowRunQuery.eq("workflow_id", workflowId)
		if (status) workflowRunQuery = workflowRunQuery.eq("status", status)
		if (start) workflowRunQuery = workflowRunQuery.gte("started_at", start)
		if (end) workflowRunQuery = workflowRunQuery.lte("started_at", end)

		const { data: runRows } = await workflowRunQuery
		workflowRuns = runRows || []
	}

	const workflowRunIds = workflowRuns.map((run) => run.run_id)

	const shouldLoadTaskRuns = type !== "workflow" || !!agentId
	let workflowTaskRuns: any[] = []
	if (shouldLoadTaskRuns) {
		if (workflowId && workflowRunIds.length === 0) {
			workflowTaskRuns = []
		} else {
		let taskRunQuery = supabase
			.from("workflow_task_runs")
			.select("run_id, workflow_run_id, workflow_task_id, status, started_at, completed_at, error, metadata")
			.eq("owner_id", user.id)
			.order("started_at", { ascending: false })
			.limit(limit)

		if (workflowRunIds.length > 0) {
			taskRunQuery = taskRunQuery.in("workflow_run_id", workflowRunIds)
		}
		if (status) taskRunQuery = taskRunQuery.eq("status", status)
		if (start) taskRunQuery = taskRunQuery.gte("started_at", start)
		if (end) taskRunQuery = taskRunQuery.lte("started_at", end)

		const { data: taskRunRows } = await taskRunQuery
		workflowTaskRuns = taskRunRows || []
		}
	}

	const taskIds = workflowTaskRuns.map((taskRun) => taskRun.workflow_task_id)
	const { data: taskRows } = taskIds.length
		? await supabase
				.from("workflow_tasks")
				.select("workflow_task_id, workflow_id, name, assistant_id")
				.in("workflow_task_id", taskIds)
		: { data: [] as any[] }
	const taskById = new Map(
		(taskRows || []).map((task: any) => [
			task.workflow_task_id,
			{
				name: task.name || "Unnamed Task",
				assistant_id: task.assistant_id || null,
				workflow_id: task.workflow_id || null,
			},
		])
	)

	const taskRunsWithAgent = workflowTaskRuns
		.map((taskRun) => {
			const taskInfo = taskById.get(taskRun.workflow_task_id)
			return {
				...taskRun,
				assistant_id: taskRun?.metadata?.assistant_id || taskInfo?.assistant_id || null,
				workflow_id: taskInfo?.workflow_id || null,
				task_name: taskInfo?.name || null,
			}
		})
		.filter((taskRun) => !agentId || taskRun.assistant_id === agentId)

	const allowedWorkflowRunIds = new Set(
		agentId ? taskRunsWithAgent.map((taskRun) => taskRun.workflow_run_id) : []
	)

	const workflowItems: ActivityItem[] = workflowRuns
		.filter((run) => !agentId || allowedWorkflowRunIds.has(run.run_id))
		.map((run) => {
			const startedAt = run.started_at ? new Date(run.started_at).getTime() : null
			const completedAt = run.completed_at ? new Date(run.completed_at).getTime() : null
			const durationMs = startedAt && completedAt ? Math.max(0, completedAt - startedAt) : null
			return {
				type: "workflow",
				id: run.run_id,
				workflow_id: run.workflow_id,
				workflow_name: workflowsById.get(run.workflow_id) || null,
				status: run.status || null,
				started_at: run.started_at || null,
				completed_at: run.completed_at || null,
				duration_ms: durationMs,
				error: run.error || null,
			}
		})

	const taskItems: ActivityItem[] = type === "workflow"
		? []
		: taskRunsWithAgent.map((taskRun) => {
			const startedAt = taskRun.started_at ? new Date(taskRun.started_at).getTime() : null
			const completedAt = taskRun.completed_at ? new Date(taskRun.completed_at).getTime() : null
			const durationMs = startedAt && completedAt ? Math.max(0, completedAt - startedAt) : null
			const assistantName = taskRun.assistant_id ? assistantsById.get(taskRun.assistant_id) : null
			return {
			type: "task",
			id: taskRun.run_id,
			workflow_id: taskRun.workflow_id,
			workflow_name: taskRun.workflow_id ? workflowsById.get(taskRun.workflow_id) || null : null,
			task_id: taskRun.workflow_task_id,
			task_name: taskRun.task_name,
			assistant_id: taskRun.assistant_id || null,
			assistant_name: assistantName || null,
			status: taskRun.status || null,
			started_at: taskRun.started_at || null,
			completed_at: taskRun.completed_at || null,
			duration_ms: durationMs,
			error: taskRun.error || null,
		}
		})

	const items = [...workflowItems, ...taskItems]
		.sort((a, b) => {
			const aTime = a.started_at ? new Date(a.started_at).getTime() : 0
			const bTime = b.started_at ? new Date(b.started_at).getTime() : 0
			return bTime - aTime
		})
		.slice(0, limit)

	return NextResponse.json({
		items,
		filters: {
			workflows: workflows || [],
			agents: assistants,
		},
	})
}
