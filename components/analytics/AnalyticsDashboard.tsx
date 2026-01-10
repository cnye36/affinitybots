"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCcw, X, Trash2, ChevronDown, ChevronRight, AlertCircle, ExternalLink, Wrench, Search, Clock, Activity, BarChart3, CheckCircle2, XCircle, Timer } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/useToast"
import { useSectionTheme } from "@/hooks/useSectionTheme"
import { motion } from "framer-motion"

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
	const [dateRangePreset, setDateRangePreset] = useState<string>("all")
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

	const handleDateRangePreset = (preset: string) => {
		setDateRangePreset(preset)
		const now = new Date()
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

		if (preset === "24hours") {
			const twentyFourHoursAgo = new Date(now)
			twentyFourHoursAgo.setHours(now.getHours() - 24)
			setStartDate(twentyFourHoursAgo.toISOString().split("T")[0])
			setEndDate(today.toISOString().split("T")[0])
		} else if (preset === "7days") {
			const sevenDaysAgo = new Date(today)
			sevenDaysAgo.setDate(today.getDate() - 7)
			setStartDate(sevenDaysAgo.toISOString().split("T")[0])
			setEndDate(today.toISOString().split("T")[0])
		} else if (preset === "30days") {
			const thirtyDaysAgo = new Date(today)
			thirtyDaysAgo.setDate(today.getDate() - 30)
			setStartDate(thirtyDaysAgo.toISOString().split("T")[0])
			setEndDate(today.toISOString().split("T")[0])
		} else if (preset === "60days") {
			const sixtyDaysAgo = new Date(today)
			sixtyDaysAgo.setDate(today.getDate() - 60)
			setStartDate(sixtyDaysAgo.toISOString().split("T")[0])
			setEndDate(today.toISOString().split("T")[0])
		} else if (preset === "90days") {
			const ninetyDaysAgo = new Date(today)
			ninetyDaysAgo.setDate(today.getDate() - 90)
			setStartDate(ninetyDaysAgo.toISOString().split("T")[0])
			setEndDate(today.toISOString().split("T")[0])
		} else if (preset === "all") {
			setStartDate("")
			setEndDate("")
		}
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

			<Card className="border-0 shadow-lg">
				
				<CardContent className="space-y-6">
					{/* Date Range and Custom Dates Row */}
					<div className="grid gap-4 md:grid-cols-3">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Time Range
							</label>
							<Select value={dateRangePreset} onValueChange={handleDateRangePreset}>
								<SelectTrigger>
									<SelectValue placeholder="Select range" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="24hours">Last 24 Hours</SelectItem>
									<SelectItem value="7days">Last 7 Days</SelectItem>
									<SelectItem value="30days">Last 30 Days</SelectItem>
									<SelectItem value="60days">Last 60 Days</SelectItem>
									<SelectItem value="90days">Last 90 Days</SelectItem>
									<SelectItem value="all">All Time</SelectItem>
									<SelectItem value="custom">Custom Range</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Start Date
							</label>
							<Input
								type="date"
								value={startDate}
								onChange={(event) => {
									setStartDate(event.target.value)
									setDateRangePreset("custom")
								}}
								placeholder="Start date"
							/>
						</div>
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								End Date
							</label>
							<Input
								type="date"
								value={endDate}
								onChange={(event) => {
									setEndDate(event.target.value)
									setDateRangePreset("custom")
								}}
								placeholder="End date"
							/>
						</div>
					</div>

					{/* Activity Filters */}
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Activity Type
							</label>
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
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Status
							</label>
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
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Workflow
							</label>
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
						</div>

						<div>
							<label className="text-sm font-medium text-muted-foreground mb-2 block">
								Agent
							</label>
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
						</div>
					</div>
				</CardContent>
			</Card>

			<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
				{/* Total Activity */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0 }}
				>
					<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
						<div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
						<div
							className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
							style={{ background: "linear-gradient(135deg, rgba(59, 130, 246, 0.4), transparent)" }}
						/>
						<CardContent className="p-6 relative">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<p className="text-sm font-medium text-muted-foreground mb-1">Total Activity</p>
									<motion.h3
										className="text-4xl font-bold tracking-tight bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 bg-clip-text text-transparent"
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.5, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
									>
										{stats.total}
									</motion.h3>
								</div>
								<motion.div
									className="p-3 rounded-2xl bg-gradient-to-br from-blue-400/20 to-teal-400/20 backdrop-blur-sm border border-border/50 shadow-lg"
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<Activity className="h-6 w-6 text-blue-600 dark:text-blue-100" />
								</motion.div>
							</div>
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-1000 ease-out" />
						</CardContent>
					</Card>
				</motion.div>

				{/* Workflow Runs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.1 }}
				>
					<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
						<div className="absolute inset-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
						<div
							className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
							style={{ background: "linear-gradient(135deg, rgba(168, 85, 247, 0.4), transparent)" }}
						/>
						<CardContent className="p-6 relative">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<p className="text-sm font-medium text-muted-foreground mb-1">Workflow Runs</p>
									<motion.h3
										className="text-4xl font-bold tracking-tight bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 bg-clip-text text-transparent"
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
									>
										{stats.workflowCount}
									</motion.h3>
								</div>
								<motion.div
									className="p-3 rounded-2xl bg-gradient-to-br from-violet-400/20 to-fuchsia-400/20 backdrop-blur-sm border border-border/50 shadow-lg"
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<BarChart3 className="h-6 w-6 text-violet-600 dark:text-violet-100" />
								</motion.div>
							</div>
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-1000 ease-out" />
						</CardContent>
					</Card>
				</motion.div>

				{/* Task Runs */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
						<div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
						<div
							className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
							style={{ background: "linear-gradient(135deg, rgba(245, 158, 11, 0.4), transparent)" }}
						/>
						<CardContent className="p-6 relative">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<p className="text-sm font-medium text-muted-foreground mb-1">Task Runs</p>
									<motion.h3
										className="text-4xl font-bold tracking-tight bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent"
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.5, delay: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
									>
										{stats.taskCount}
									</motion.h3>
								</div>
								<motion.div
									className="p-3 rounded-2xl bg-gradient-to-br from-amber-400/20 to-red-400/20 backdrop-blur-sm border border-border/50 shadow-lg"
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-100" />
								</motion.div>
							</div>
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-1000 ease-out" />
						</CardContent>
					</Card>
				</motion.div>

				{/* Failures */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
						<div className="absolute inset-0 bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
						<div
							className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
							style={{ background: "linear-gradient(135deg, rgba(239, 68, 68, 0.4), transparent)" }}
						/>
						<CardContent className="p-6 relative">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<p className="text-sm font-medium text-muted-foreground mb-1">Failures</p>
									<motion.h3
										className="text-4xl font-bold tracking-tight bg-gradient-to-br from-red-500 via-rose-500 to-pink-500 bg-clip-text text-transparent"
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.5, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
									>
										{stats.failed}
									</motion.h3>
								</div>
								<motion.div
									className="p-3 rounded-2xl bg-gradient-to-br from-red-400/20 to-pink-400/20 backdrop-blur-sm border border-border/50 shadow-lg"
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<XCircle className="h-6 w-6 text-red-600 dark:text-red-100" />
								</motion.div>
							</div>
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-1000 ease-out" />
						</CardContent>
					</Card>
				</motion.div>

				{/* Avg Duration */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
				>
					<Card className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
						<div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500" />
						<div
							className="absolute -inset-[1px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm -z-10"
							style={{ background: "linear-gradient(135deg, rgba(34, 197, 94, 0.4), transparent)" }}
						/>
						<CardContent className="p-6 relative">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<p className="text-sm font-medium text-muted-foreground mb-1">Avg Duration</p>
									<motion.h3
										className="text-4xl font-bold tracking-tight bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 bg-clip-text text-transparent"
										initial={{ scale: 0.5 }}
										animate={{ scale: 1 }}
										transition={{ duration: 0.5, delay: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
									>
										{formatDuration(stats.averageDuration)}
									</motion.h3>
								</div>
								<motion.div
									className="p-3 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-lime-400/20 backdrop-blur-sm border border-border/50 shadow-lg"
									whileHover={{ scale: 1.1, rotate: 5 }}
									transition={{ type: "spring", stiffness: 400, damping: 10 }}
								>
									<Timer className="h-6 w-6 text-emerald-600 dark:text-emerald-100" />
								</motion.div>
							</div>
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-12 group-hover:right-full transition-all duration-1000 ease-out" />
						</CardContent>
					</Card>
				</motion.div>
			</div>

			<Card className="border-0 shadow-lg">
				<CardHeader>
					<CardTitle className="text-lg">Activity Feed</CardTitle>
					<p className="text-sm text-muted-foreground mt-1">
						Recent workflow and task execution history
					</p>
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
