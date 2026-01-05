import { NextResponse } from "next/server"
import { createClient } from "@/supabase/server"

type ActivityType = "workflow" | "task"

const MAX_TOOL_CALL_DEPTH = 6

const collectToolCalls = (value: any, calls: string[], depth = 0) => {
	if (value == null || depth > MAX_TOOL_CALL_DEPTH) return
	if (Array.isArray(value)) {
		for (const item of value) collectToolCalls(item, calls, depth + 1)
		return
	}
	if (typeof value !== "object") return

	const toolCalls = (value as any).tool_calls
	if (Array.isArray(toolCalls)) {
		for (const call of toolCalls) {
			const name = call?.name || call?.tool_name || call?.toolName
			if (typeof name === "string" && name.length > 0) calls.push(name)
		}
	}

	const additionalToolCalls = (value as any)?.additional_kwargs?.tool_calls
	if (Array.isArray(additionalToolCalls)) {
		for (const call of additionalToolCalls) {
			const name = call?.name || call?.tool_name || call?.toolName
			if (typeof name === "string" && name.length > 0) calls.push(name)
		}
	}

	if ((value as any).type === "tool") {
		const name = (value as any).name || (value as any).tool
		if (typeof name === "string" && name.length > 0) calls.push(name)
	}

	for (const key of Object.keys(value as Record<string, unknown>)) {
		collectToolCalls((value as any)[key], calls, depth + 1)
	}
}

const extractToolCallsFromCheckpoint = (checkpoint: any) => {
	const calls: string[] = []
	collectToolCalls(checkpoint, calls)
	return calls
}

const extractWebSearchInfo = (checkpoint: any): { searched: boolean; sources?: string[] } => {
	const toolCalls = extractToolCallsFromCheckpoint(checkpoint)
	const hasWebSearch = toolCalls.some((call) => 
		call.toLowerCase().includes("web_search") || 
		call.toLowerCase().includes("tavily") ||
		call.toLowerCase().includes("search")
	)
	
	if (!hasWebSearch) return { searched: false }
	
	// Try to extract sources from checkpoint
	const sources: string[] = []
	const extractSources = (value: any, depth = 0) => {
		if (value == null || depth > MAX_TOOL_CALL_DEPTH) return
		if (Array.isArray(value)) {
			for (const item of value) extractSources(item, depth + 1)
			return
		}
		if (typeof value !== "object") return
		
		if (value.url || value.source || value.link) {
			const source = value.url || value.source || value.link
			if (typeof source === "string" && !sources.includes(source)) {
				sources.push(source)
			}
		}
		
		if (value.sources && Array.isArray(value.sources)) {
			for (const src of value.sources) {
				if (typeof src === "string" && !sources.includes(src)) {
					sources.push(src)
				} else if (src?.url && !sources.includes(src.url)) {
					sources.push(src.url)
				}
			}
		}
		
		for (const key of Object.keys(value as Record<string, unknown>)) {
			extractSources((value as any)[key], depth + 1)
		}
	}
	
	extractSources(checkpoint)
	return { searched: true, sources: sources.length > 0 ? sources : undefined }
}

type ActivityItem = {
	type: ActivityType
	id: string
	workflow_id: string | null
	workflow_name: string | null
	workflow_type?: string | null
	orchestrator_goal?: string | null
	task_id?: string | null
	task_name?: string | null
	assistant_id?: string | null
	assistant_name?: string | null
	status: string | null
	started_at: string | null
	completed_at: string | null
	duration_ms: number | null
	error?: string | null
	tool_calls?: string[]
	tool_call_count?: number
	web_search?: { searched: boolean; sources?: string[] }
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
		.select("workflow_id, name, workflow_type, orchestrator_config")
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
		(workflows || []).map((workflow) => {
			const orchestratorConfig = (workflow as any).orchestrator_config
			const goal = orchestratorConfig?.manager?.user_prompt || null
			return [
				workflow.workflow_id,
				{ 
					name: workflow.name, 
					workflow_type: (workflow as any).workflow_type || null,
					orchestrator_goal: goal
				}
			]
		})
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

	// Fetch checkpoints for task runs to extract tool calls and web search info
	const taskRunIds = taskRunsWithAgent.map((tr) => tr.run_id)
	let checkpoints: any[] = []
	if (taskRunIds.length > 0) {
		const { data: checkpointRows } = await supabase
			.from("checkpoints")
			.select("run_id, checkpoint, metadata")
			.in("run_id", taskRunIds)
		checkpoints = checkpointRows || []
	}

	// Build tool calls and web search info by run_id
	const toolCallsByRun: Record<string, { names: string[]; count: number }> = {}
	const webSearchByRun: Record<string, { searched: boolean; sources?: string[] }> = {}
	
	for (const checkpointRow of checkpoints) {
		const runKey = checkpointRow.run_id as string
		const checkpoint = checkpointRow.checkpoint ?? checkpointRow
		
		// Extract tool calls
		const calls = extractToolCallsFromCheckpoint(checkpoint)
		if (calls.length > 0) {
			const entry = toolCallsByRun[runKey] || { names: [], count: 0 }
			entry.names.push(...calls)
			entry.count += calls.length
			toolCallsByRun[runKey] = entry
		}
		
		// Extract web search info
		const webSearchInfo = extractWebSearchInfo(checkpoint)
		if (webSearchInfo.searched) {
			webSearchByRun[runKey] = webSearchInfo
		}
	}

	const allowedWorkflowRunIds = new Set(
		agentId ? taskRunsWithAgent.map((taskRun) => taskRun.workflow_run_id) : []
	)

	const workflowItems: ActivityItem[] = workflowRuns
		.filter((run) => !agentId || allowedWorkflowRunIds.has(run.run_id))
		.map((run) => {
			const startedAt = run.started_at ? new Date(run.started_at).getTime() : null
			const completedAt = run.completed_at ? new Date(run.completed_at).getTime() : null
			const durationMs = startedAt && completedAt ? Math.max(0, completedAt - startedAt) : null
			const workflowInfo = workflowsById.get(run.workflow_id)
			return {
				type: "workflow",
				id: run.run_id,
				workflow_id: run.workflow_id,
				workflow_name: workflowInfo?.name || null,
				workflow_type: workflowInfo?.workflow_type || null,
				orchestrator_goal: workflowInfo?.orchestrator_goal || null,
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
			const workflowInfo = taskRun.workflow_id ? workflowsById.get(taskRun.workflow_id) : null
			
			// Get tool calls and web search info for this task run
			const toolCalls = toolCallsByRun[taskRun.run_id]
			const webSearch = webSearchByRun[taskRun.run_id] || { searched: false }
			
			return {
			type: "task",
			id: taskRun.run_id,
			workflow_id: taskRun.workflow_id,
			workflow_name: workflowInfo?.name || null,
			task_id: taskRun.workflow_task_id,
			task_name: taskRun.task_name,
			assistant_id: taskRun.assistant_id || null,
			assistant_name: assistantName || null,
			status: taskRun.status || null,
			started_at: taskRun.started_at || null,
			completed_at: taskRun.completed_at || null,
			duration_ms: durationMs,
			error: taskRun.error || null,
			tool_calls: toolCalls?.names || [],
			tool_call_count: toolCalls?.count || 0,
			web_search: webSearch,
		}
		})

	// Group task runs by workflow_run_id
	const taskRunsByWorkflowRun = new Map<string, ActivityItem[]>()
	for (const taskItem of taskItems) {
		// Find the workflow_run_id for this task run
		const taskRun = workflowTaskRuns.find((tr) => tr.run_id === taskItem.id)
		if (taskRun?.workflow_run_id) {
			const existing = taskRunsByWorkflowRun.get(taskRun.workflow_run_id) || []
			existing.push(taskItem)
			taskRunsByWorkflowRun.set(taskRun.workflow_run_id, existing)
		}
	}

	// For orchestrator workflows, get agents from workflow_tasks (not just from task runs)
	const orchestratorWorkflowIds = workflowItems
		.filter((item) => item.workflow_type === "orchestrator")
		.map((item) => item.workflow_id)
		.filter((id): id is string => id !== null)
	
	const orchestratorAgentsByWorkflow: Record<string, string[]> = {}
	if (orchestratorWorkflowIds.length > 0) {
		const { data: orchestratorTasks } = await supabase
			.from("workflow_tasks")
			.select("workflow_id, assistant_id")
			.in("workflow_id", orchestratorWorkflowIds)
		
		for (const task of orchestratorTasks || []) {
			const workflowId = task.workflow_id
			const assistantId = task.assistant_id
			if (workflowId && assistantId) {
				const assistantName = assistantsById.get(assistantId)
				if (assistantName) {
					if (!orchestratorAgentsByWorkflow[workflowId]) {
						orchestratorAgentsByWorkflow[workflowId] = []
					}
					if (!orchestratorAgentsByWorkflow[workflowId].includes(assistantName)) {
						orchestratorAgentsByWorkflow[workflowId].push(assistantName)
					}
				}
			}
		}
	}

	// Create hierarchical structure: workflow runs with nested task runs
	const workflowRunsWithTasks = workflowItems.map((workflowItem) => {
		const taskRuns = taskRunsByWorkflowRun.get(workflowItem.id) || []
		
		// Enhance task runs with tool calls and web search info
		const enhancedTaskRuns = taskRuns.map((taskRun) => {
			const toolCalls = toolCallsByRun[taskRun.id]
			const webSearch = webSearchByRun[taskRun.id] || { searched: false }
			return {
				...taskRun,
				tool_calls: toolCalls?.names || [],
				tool_call_count: toolCalls?.count || 0,
				web_search: webSearch,
			}
		}).sort((a, b) => {
			const aTime = a.started_at ? new Date(a.started_at).getTime() : 0
			const bTime = b.started_at ? new Date(b.started_at).getTime() : 0
			return aTime - bTime // Sort tasks chronologically within workflow
		})
		
		// Get unique agents used in this workflow
		const agentsUsed = new Set<string>()
		
		// For orchestrator workflows, use agents from workflow_tasks
		if (workflowItem.workflow_type === "orchestrator" && workflowItem.workflow_id) {
			const orchestratorAgents = orchestratorAgentsByWorkflow[workflowItem.workflow_id] || []
			orchestratorAgents.forEach((agent) => agentsUsed.add(agent))
		} else {
			// For sequential workflows, get agents from task runs
			enhancedTaskRuns.forEach((tr) => {
				if (tr.assistant_name) agentsUsed.add(tr.assistant_name)
			})
		}
		
		return {
			...workflowItem,
			taskRuns: enhancedTaskRuns,
			agents_used: Array.from(agentsUsed),
		}
	})

	// Sort workflow runs by started_at (most recent first)
	const sortedWorkflowRuns = workflowRunsWithTasks.sort((a, b) => {
		const aTime = a.started_at ? new Date(a.started_at).getTime() : 0
		const bTime = b.started_at ? new Date(b.started_at).getTime() : 0
		return bTime - aTime
	})

	// If type filter is "task" only, return flat task items (for backward compatibility)
	// Otherwise return hierarchical structure
	const items = type === "task" 
		? taskItems.slice(0, limit)
		: sortedWorkflowRuns.slice(0, limit)

	return NextResponse.json({
		items,
		filters: {
			workflows: workflows || [],
			agents: assistants,
		},
	})
}
