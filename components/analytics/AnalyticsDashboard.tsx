"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw } from "lucide-react"

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
		const durations = items.map((item) => item.duration_ms).filter((value) => typeof value === "number") as number[]
		const averageDuration = durations.length
			? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length)
			: null
		return { total, workflowCount, taskCount, failed, averageDuration }
	}, [items])

	return (
		<div className="flex flex-col gap-6 p-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Analytics</h1>
					<p className="text-sm text-muted-foreground">Trace workflow and agent activity across runs.</p>
				</div>
				<Button variant="outline" size="sm" onClick={fetchAnalytics}>
					<RefreshCcw className="h-4 w-4 mr-2" />
					Refresh
				</Button>
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
							className="flex flex-col gap-2 rounded-lg border p-3 text-sm md:flex-row md:items-center md:justify-between"
						>
							<div className="space-y-1">
								<div className="flex items-center gap-2">
									<Badge variant={item.type === "workflow" ? "default" : "secondary"}>
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
								<Badge variant="outline">{item.status || "unknown"}</Badge>
								<span className="text-xs text-muted-foreground">
									{item.started_at ? new Date(item.started_at).toLocaleString() : "—"}
								</span>
								<span className="text-xs text-muted-foreground">
									Duration {formatDuration(item.duration_ms)}
								</span>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	)
}
