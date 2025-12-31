"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, X, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/useToast"
import { useSectionTheme } from "@/hooks/useSectionTheme"

type ActivityItem = {
	type: "workflow" | "task"
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
	const { toast } = useToast()

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
		const total = items.length
		const workflowCount = items.filter((item) => item.type === "workflow").length
		const taskCount = items.filter((item) => item.type === "task").length
		const failed = items.filter((item) => item.status === "failed" || item.status === "error").length
		const running = items.filter((item) => item.status === "running").length
		const durations = items.map((item) => item.duration_ms).filter((value) => typeof value === "number") as number[]
		const averageDuration = durations.length
			? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
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
					{items.map((item) => (
						<div
							key={item.id}
							className={`flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between ${theme.borderColor}`}
						>
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Badge
										variant={item.type === "workflow" ? "default" : "secondary"}
										className={
											item.type === "workflow"
												? `${theme.accentBg} text-white border-0`
												: ""
										}
									>
										{item.type === "workflow" ? "Workflow" : "Task"}
									</Badge>
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
								{item.type === "workflow" && item.status === "running" && item.workflow_id && (
									<Button
										variant="ghost"
										size="sm"
										className={`h-7 px-2 ${theme.sidebarText}`}
										onClick={() => handleCancelRun(item)}
										disabled={cancellingIds.has(item.id)}
									>
										<X className="h-3 w-3" />
									</Button>
								)}
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
