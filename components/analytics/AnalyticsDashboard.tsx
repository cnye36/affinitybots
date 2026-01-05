"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, X, Trash2, ChevronDown, ChevronRight, AlertCircle, ExternalLink, Wrench, Search, Clock } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/useToast"
import { useSectionTheme } from "@/hooks/useSectionTheme"

type ActivityItem = {
	type: "workflow" | "task"
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
	taskRuns?: ActivityItem[] // Nested task runs for workflow items
	agents_used?: string[] // Agents used in workflow
	tool_calls?: string[]
	tool_call_count?: number
	web_search?: { searched: boolean; sources?: string[] }
}

const truncateGoal = (goal: string | null | undefined, maxWords: number = 12): string => {
	if (!goal) return ""
	const words = goal.trim().split(/\s+/)
	if (words.length <= maxWords) return goal
	return words.slice(0, maxWords).join(" ") + "..."
}

type FilterOption = {
	workflow_id?: string
	name?: string
	assistant_id?: string
}

type AnalyticsResponse = {
	items: ActivityItem[]
	filters: {
		workflows: Array<{ workflow_id: string; name: string }>
		agents: Array<{ assistant_id: string; name: string }>
	}
}

const formatDuration = (durationMs: number | null) => {
	if (!durationMs) return "—"
	const seconds = Math.max(0, Math.floor(durationMs / 1000))
	if (seconds < 60) return `${seconds}s`
	const minutes = Math.floor(seconds / 60)
	const remainder = seconds % 60
	return `${minutes}m ${remainder}s`
}

export function AnalyticsDashboard() {
	const theme = useSectionTheme()
	const [items, setItems] = useState<ActivityItem[]>([])
	const [workflows, setWorkflows] = useState<FilterOption[]>([])
	const [agents, setAgents] = useState<FilterOption[]>([])
	const [typeFilter, setTypeFilter] = useState<"all" | "workflow" | "task">("all")
	const [statusFilter, setStatusFilter] = useState<string>("all")
	const [workflowFilter, setWorkflowFilter] = useState<string>("all")
	const [agentFilter, setAgentFilter] = useState<string>("all")
	const [startDate, setStartDate] = useState<string>("")
	const [endDate, setEndDate] = useState<string>("")
	const [loading, setLoading] = useState(false)
	const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set())
	const [cleaningUp, setCleaningUp] = useState(false)
	const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set())
	const { toast } = useToast()
	
	const toggleWorkflowExpansion = (workflowId: string) => {
		setExpandedWorkflows((prev) => {
			const next = new Set(prev)
			if (next.has(workflowId)) {
				next.delete(workflowId)
			} else {
				next.add(workflowId)
			}
			return next
		})
	}

	const fetchAnalytics = async () => {
		setLoading(true)
		try {
			const params = new URLSearchParams()
			if (typeFilter !== "all") params.set("type", typeFilter)
			if (statusFilter !== "all") params.set("status", statusFilter)
			if (workflowFilter !== "all") params.set("workflowId", workflowFilter)
			if (agentFilter !== "all") params.set("agentId", agentFilter)
			if (startDate) params.set("start", new Date(startDate).toISOString())
			if (endDate) params.set("end", new Date(endDate).toISOString())
			const res = await fetch(`/api/analytics/activity?${params.toString()}`)
			if (!res.ok) return
			const data = (await res.json()) as AnalyticsResponse
			setItems(data.items || [])
			setWorkflows(data.filters?.workflows || [])
			setAgents(data.filters?.agents || [])
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchAnalytics()
	}, [typeFilter, statusFilter, workflowFilter, agentFilter, startDate, endDate])

	const stats = useMemo(() => {
		// Flatten items to get all workflow and task runs
		const allItems: ActivityItem[] = []
		for (const item of items) {
			if (item.type === "workflow" && item.taskRuns) {
				allItems.push(item, ...item.taskRuns)
			} else {
				allItems.push(item)
			}
		}
		
		const total = allItems.length
		const workflowCount = items.filter((item) => item.type === "workflow").length
		const taskCount = allItems.filter((item) => item.type === "task").length
		const failed = allItems.filter((item) => item.status === "failed" || item.status === "error").length
		const running = allItems.filter((item) => item.status === "running").length
		
		// Calculate average duration from workflow runs only (not task runs)
		const workflowDurations = items
			.filter((item) => item.type === "workflow")
			.map((item) => item.duration_ms)
			.filter((value) => typeof value === "number") as number[]
		const averageDuration = workflowDurations.length
			? Math.round(workflowDurations.reduce((sum, value) => sum + value, 0) / workflowDurations.length)
			: null
		return { total, workflowCount, taskCount, failed, running, averageDuration }
	}, [items])

	const handleCancelRun = async (item: ActivityItem) => {
		if (item.type !== "workflow" || !item.workflow_id || item.status !== "running") {
			return
		}

		setCancellingIds((prev) => new Set(prev).add(item.id))
		try {
			const res = await fetch(`/api/workflows/${item.workflow_id}/runs/${item.id}/cancel`, {
				method: "POST",
			})

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: "Failed to cancel workflow run" }))
				throw new Error(error.error || "Failed to cancel workflow run")
			}

			toast({
				title: "Workflow cancelled",
				description: "The workflow run has been marked as failed.",
			})

			// Refresh the list
			await fetchAnalytics()
		} catch (error) {
			toast({
				title: "Error cancelling workflow",
				description: error instanceof Error ? error.message : "Failed to cancel workflow run",
				variant: "destructive",
			})
		} finally {
			setCancellingIds((prev) => {
				const next = new Set(prev)
				next.delete(item.id)
				return next
			})
		}
	}

	const handleCleanupStuckRuns = async () => {
		setCleaningUp(true)
		try {
			const res = await fetch("/api/workflows/cleanup-stuck-runs?maxAgeHours=1", {
				method: "POST",
			})

			if (!res.ok) {
				const error = await res.json().catch(() => ({ error: "Failed to cleanup stuck runs" }))
				throw new Error(error.error || "Failed to cleanup stuck runs")
			}

			const data = await res.json()
			toast({
				title: "Cleanup complete",
				description: data.message || `Updated ${data.updated || 0} stuck workflow run(s)`,
			})

			// Refresh the list
			await fetchAnalytics()
		} catch (error) {
			toast({
				title: "Error cleaning up",
				description: error instanceof Error ? error.message : "Failed to cleanup stuck runs",
				variant: "destructive",
			})
		} finally {
			setCleaningUp(false)
		}
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className={`text-3xl font-bold ${theme.headerGradient} bg-clip-text text-transparent`}>
						Analytics
					</h1>
					<p className="text-sm text-muted-foreground mt-1">
						Trace workflow and agent activity across runs.
					</p>
				</div>
				<div className="flex gap-2">
					{stats.running > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={handleCleanupStuckRuns}
							disabled={cleaningUp}
							className={`${theme.borderColor} hover:${theme.subtleBg}`}
						>
							<Trash2 className="h-4 w-4 mr-2" />
							{cleaningUp ? "Cleaning up..." : `Cleanup ${stats.running} stuck`}
						</Button>
					)}
					<Button
						variant="outline"
						size="sm"
						onClick={fetchAnalytics}
						className={`${theme.borderColor} hover:${theme.subtleBg}`}
					>
						<RefreshCcw className="h-4 w-4 mr-2" />
						Refresh
					</Button>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Filters</CardTitle>
				</CardHeader>
				<CardContent className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
					<Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
						<SelectTrigger>
							<SelectValue placeholder="Type" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All activity</SelectItem>
							<SelectItem value="workflow">Workflows</SelectItem>
							<SelectItem value="task">Tasks</SelectItem>
						</SelectContent>
					</Select>

					<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
						<SelectTrigger>
							<SelectValue placeholder="Status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							<SelectItem value="running">Running</SelectItem>
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
							<SelectItem value="error">Error</SelectItem>
						</SelectContent>
					</Select>

					<Select value={workflowFilter} onValueChange={(value) => setWorkflowFilter(value)}>
						<SelectTrigger>
							<SelectValue placeholder="Workflow" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All workflows</SelectItem>
							{workflows.map((workflow) => (
								<SelectItem key={workflow.workflow_id} value={workflow.workflow_id || ""}>
									{workflow.name || "Untitled"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Select value={agentFilter} onValueChange={(value) => setAgentFilter(value)}>
						<SelectTrigger>
							<SelectValue placeholder="Agent" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All agents</SelectItem>
							{agents.map((agent) => (
								<SelectItem key={agent.assistant_id} value={agent.assistant_id || ""}>
									{agent.name || "Unnamed Agent"}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Input
						type="date"
						value={startDate}
						onChange={(event) => setStartDate(event.target.value)}
						placeholder="Start date"
					/>
					<Input
						type="date"
						value={endDate}
						onChange={(event) => setEndDate(event.target.value)}
						placeholder="End date"
					/>
				</CardContent>
			</Card>

			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">Total Activity</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{stats.total}</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">Workflow Runs</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{stats.workflowCount}</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">Task Runs</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{stats.taskCount}</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">Failures</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">{stats.failed}</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm text-muted-foreground">Avg Duration</CardTitle>
					</CardHeader>
					<CardContent className="text-2xl font-semibold">
						{formatDuration(stats.averageDuration)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Activity Feed</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{loading && <div className="text-sm text-muted-foreground">Loading activity…</div>}
					{!loading && items.length === 0 && (
						<div className="text-sm text-muted-foreground">No activity found for these filters.</div>
					)}
					{items.map((item) => {
						// Handle workflow runs with nested task runs
						if (item.type === "workflow" && item.taskRuns !== undefined) {
							const isExpanded = expandedWorkflows.has(item.id)
							const taskRuns = item.taskRuns || []
							const isFailed = item.status === "failed" || item.status === "error"
							const hasTaskRuns = taskRuns.length > 0
							
							return (
								<div
									key={item.id}
									className={`rounded-lg border ${theme.borderColor} ${isFailed ? "border-red-500/50 bg-red-500/5" : ""}`}
								>
									{/* Workflow Run Header */}
									<div
										className={`flex flex-col gap-2 p-3 text-sm md:flex-row md:items-center md:justify-between ${hasTaskRuns ? "cursor-pointer hover:bg-accent/50" : ""}`}
										onClick={hasTaskRuns ? () => toggleWorkflowExpansion(item.id) : undefined}
									>
										<div className="space-y-1 flex-1">
											<div className="flex items-center gap-2 flex-wrap">
												{hasTaskRuns && (
													<button
														onClick={(e) => {
															e.stopPropagation()
															toggleWorkflowExpansion(item.id)
														}}
														className="p-0.5 hover:bg-accent rounded"
													>
														{isExpanded ? (
															<ChevronDown className="h-4 w-4" />
														) : (
															<ChevronRight className="h-4 w-4" />
														)}
													</button>
												)}
												<Badge
													variant={isFailed ? "destructive" : item.status === "completed" ? "default" : "secondary"}
													className={
														!isFailed && item.status === "completed"
															? `${theme.accentBg} text-white border-0`
															: ""
													}
												>
													{item.workflow_type === "orchestrator" ? "Orchestrator" : "Workflow"}
												</Badge>
												<span className="font-medium">{item.workflow_name || "Untitled Workflow"}</span>
												{isFailed && (
													<Badge variant="destructive" className="gap-1">
														<AlertCircle className="h-3 w-3" />
														Failed
													</Badge>
												)}
												{item.status === "completed" && (
													<Badge variant="default" className="bg-green-600 hover:bg-green-700">
														Success
													</Badge>
												)}
												{item.workflow_id && (
													<Link
														href={`/workflows/builder?id=${item.workflow_id}&execution=${item.id}`}
														onClick={(e) => e.stopPropagation()}
														className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
													>
														<ExternalLink className="h-3 w-3" />
														View Execution
													</Link>
												)}
											</div>
											{item.error && (
												<div className="text-xs text-red-600 dark:text-red-400 font-medium">
													Error: {item.error}
												</div>
											)}
											{item.agents_used && item.agents_used.length > 0 && (
												<div className="text-xs text-muted-foreground">
													Agents: {item.agents_used.join(", ")}
												</div>
											)}
											{item.workflow_type === "orchestrator" && item.orchestrator_goal && (
												<div className="text-xs text-muted-foreground">
													Goal: {truncateGoal(item.orchestrator_goal)}
												</div>
											)}
											{hasTaskRuns && item.workflow_type !== "orchestrator" && (
												<div className="text-xs text-muted-foreground">
													{taskRuns.length} task{taskRuns.length !== 1 ? "s" : ""} • Click to {isExpanded ? "collapse" : "expand"}
												</div>
											)}
											{item.workflow_type === "orchestrator" && hasTaskRuns && (
												<div className="text-xs text-muted-foreground">
													{taskRuns.length} execution{taskRuns.length !== 1 ? "s" : ""} • Click to {isExpanded ? "collapse" : "expand"}
												</div>
											)}
										</div>
										<div className="flex flex-wrap items-center gap-2">
											<Badge variant="outline" className={theme.borderColor}>
												{item.status || "unknown"}
											</Badge>
											<span className="text-xs text-muted-foreground">
												{item.started_at ? new Date(item.started_at).toLocaleString() : "—"}
											</span>
											<span className="text-xs text-muted-foreground">
												Duration {formatDuration(item.duration_ms)}
											</span>
											{item.status === "running" && item.workflow_id && (
												<Button
													variant="ghost"
													size="sm"
													className={`h-7 px-2 ${theme.sidebarText}`}
													onClick={(e) => {
														e.stopPropagation()
														handleCancelRun(item)
													}}
													disabled={cancellingIds.has(item.id)}
												>
													<X className="h-3 w-3" />
												</Button>
											)}
										</div>
									</div>
									
									{/* Nested Task Runs */}
									{isExpanded && hasTaskRuns && (
										<div className="border-t bg-muted/30">
											{taskRuns.map((taskRun) => (
												<div
													key={taskRun.id}
													className="flex flex-col gap-3 p-3 pl-8 text-sm border-b last:border-b-0"
												>
													<div className="flex items-start justify-between gap-4">
														<div className="space-y-1.5 flex-1">
															<div className="flex items-center gap-2 flex-wrap">
																<Badge variant="secondary" className="text-xs">
																	Task
																</Badge>
																<span className="font-medium">{taskRun.task_name || "Unnamed Task"}</span>
																{(taskRun.status === "failed" || taskRun.status === "error") && (
																	<Badge variant="destructive" className="text-xs gap-1">
																		<AlertCircle className="h-3 w-3" />
																		Failed
																	</Badge>
																)}
															</div>
															<div className="text-xs text-muted-foreground">
																{taskRun.assistant_name ? `Agent: ${taskRun.assistant_name}` : "Agent: —"}
															</div>
															{taskRun.error && (
																<div className="text-xs text-red-600 dark:text-red-400">
																	Error: {taskRun.error}
																</div>
															)}
														</div>
														<div className="flex flex-wrap items-center gap-2">
															<Badge variant="outline" className={theme.borderColor}>
																{taskRun.status || "unknown"}
															</Badge>
															<span className="text-xs text-muted-foreground">
																{taskRun.started_at ? new Date(taskRun.started_at).toLocaleString() : "—"}
															</span>
															<span className="text-xs text-muted-foreground flex items-center gap-1">
																<Clock className="h-3 w-3" />
																{formatDuration(taskRun.duration_ms)}
															</span>
														</div>
													</div>
													
													{/* Task Details */}
													{(taskRun.tool_calls && taskRun.tool_calls.length > 0) || taskRun.web_search?.searched ? (
														<div className="space-y-2 pl-4 border-l-2 border-border/50">
															{taskRun.tool_calls && taskRun.tool_calls.length > 0 && (
																<div className="flex items-start gap-2">
																	<Wrench className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
																	<div className="flex-1">
																		<div className="text-xs font-medium text-muted-foreground mb-1">
																			Tool Calls ({taskRun.tool_call_count || taskRun.tool_calls.length})
																		</div>
																		<div className="flex flex-wrap gap-1">
																			{Array.from(new Set(taskRun.tool_calls)).slice(0, 10).map((tool, idx) => (
																				<Badge key={idx} variant="outline" className="text-xs">
																					{tool}
																				</Badge>
																			))}
																			{taskRun.tool_calls.length > 10 && (
																				<Badge variant="outline" className="text-xs">
																					+{taskRun.tool_calls.length - 10} more
																				</Badge>
																			)}
																		</div>
																	</div>
																</div>
															)}
															{taskRun.web_search?.searched && (
																<div className="flex items-start gap-2">
																	<Search className="h-3.5 w-3.5 mt-0.5 text-muted-foreground flex-shrink-0" />
																	<div className="flex-1">
																		<div className="text-xs font-medium text-muted-foreground mb-1">
																			Web Search
																		</div>
																		{taskRun.web_search.sources && taskRun.web_search.sources.length > 0 ? (
																			<div className="space-y-1">
																				<div className="text-xs text-muted-foreground">
																					Found {taskRun.web_search.sources.length} source{taskRun.web_search.sources.length !== 1 ? "s" : ""}
																				</div>
																				<div className="space-y-0.5">
																					{taskRun.web_search.sources.slice(0, 3).map((source, idx) => (
																						<a
																							key={idx}
																							href={source}
																							target="_blank"
																							rel="noopener noreferrer"
																							className="block text-xs text-primary hover:underline truncate"
																						>
																							{source}
																						</a>
																					))}
																					{taskRun.web_search.sources.length > 3 && (
																						<div className="text-xs text-muted-foreground">
																							+{taskRun.web_search.sources.length - 3} more sources
																						</div>
																					)}
																				</div>
																			</div>
																		) : (
																			<div className="text-xs text-muted-foreground">
																				Web search performed
																			</div>
																		)}
																	</div>
																</div>
															)}
														</div>
													) : null}
												</div>
											))}
										</div>
									)}
								</div>
							)
						}
						
						// Handle standalone task runs (when type filter is "task")
						return (
							<div
								key={item.id}
								className={`flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between ${theme.borderColor}`}
							>
								<div className="space-y-1">
									<div className="flex items-center gap-2">
										<Badge variant="secondary">Task</Badge>
										<span className="font-medium">{item.workflow_name || "Untitled Workflow"}</span>
										{item.task_name && <span className="text-muted-foreground">/ {item.task_name}</span>}
									</div>
									<div className="text-xs text-muted-foreground">
										{item.assistant_name ? `Agent: ${item.assistant_name}` : "Agent: —"}
									</div>
								</div>
								<div className="flex flex-wrap items-center gap-2">
									<Badge variant="outline" className={theme.borderColor}>
										{item.status || "unknown"}
									</Badge>
									<span className="text-xs text-muted-foreground">
										{item.started_at ? new Date(item.started_at).toLocaleString() : "—"}
									</span>
									<span className="text-xs text-muted-foreground">
										Duration {formatDuration(item.duration_ms)}
									</span>
								</div>
							</div>
						)
					})}
				</CardContent>
			</Card>
		</div>
	)
}
