"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GitBranch, GitMerge, CheckCircle2, Calendar } from "lucide-react"

interface WorkflowListItemProps {
	workflow: any
	onDelete: (e: React.MouseEvent, workflowId: string, workflowName: string) => void
	onClick: () => void
}

function formatRelativeTime(dt?: string | null): string {
	if (!dt) return "Never"
	try {
		const d = new Date(dt)
		if (isNaN(d.getTime())) return "Never"
		const now = new Date()
		const diffMs = now.getTime() - d.getTime()
		const diffMins = Math.floor(diffMs / 60000)
		const diffHours = Math.floor(diffMs / 3600000)
		const diffDays = Math.floor(diffMs / 86400000)

		if (diffMins < 1) return "just now"
		if (diffMins < 60) return `${diffMins}m ago`
		if (diffHours < 24) return `${diffHours}h ago`
		if (diffDays < 7) return `${diffDays}d ago`
		return d.toLocaleDateString()
	} catch {
		return "Never"
	}
}

function formatDate(dt?: string | null): string {
	if (!dt) return "Never"
	try {
		const d = new Date(dt)
		if (isNaN(d.getTime())) return "Never"
		return d.toLocaleDateString()
	} catch {
		return "Never"
	}
}

export function WorkflowListItem({ workflow, onDelete, onClick }: WorkflowListItemProps) {
	const nodes: any[] = Array.isArray(workflow?.nodes) ? (workflow.nodes as any[]) : []
	const taskNodes = nodes.filter((n) => (n?.type ?? "task") === "task")
	const nodeCount = (taskNodes.length || nodes.length || 0) as number

	// Collect unique assistants from node data
	const assistants: Array<{ id?: string; name?: string; avatar?: string }> = []
	const seen = new Set<string>()
	const nodesToProcess = taskNodes.length > 0 ? taskNodes : nodes
	nodesToProcess.forEach((n) => {
		const data = n?.data || {}
		const a = data.assignedAssistant || data.assigned_assistant || data?.config?.assigned_assistant
		if (a) {
			const key = a.id || a.name || JSON.stringify(a)
			if (key && !seen.has(key)) {
				seen.add(key)
				assistants.push({ id: a.id, name: a.name, avatar: a.avatar })
			}
		}
	})

	const displayAssistants = assistants.slice(0, 3)
	const overflow = assistants.length - displayAssistants.length

	// Check if workflow was run recently
	const isRecentlyRun = workflow?.last_run_at &&
		new Date().getTime() - new Date(workflow.last_run_at).getTime() < 24 * 60 * 60 * 1000

	const workflowType = workflow?.workflow_type || "sequential"
	const isOrchestrator = workflowType === "orchestrator"

	const getDescription = () => {
		const parts = []
		parts.push(`${nodeCount} ${nodeCount === 1 ? "node" : "nodes"}`)
		if (workflow?.created_at) {
			parts.push(`Created: ${formatDate(workflow.created_at)}`)
		}
		if (workflow?.last_run_at) {
			const lastRun = formatRelativeTime(workflow.last_run_at)
			parts.push(`Last run: ${lastRun}`)
		}
		return parts.join(" • ")
	}

	return (
		<Card
			className="group relative overflow-hidden border border-border hover:border-blue-500/50 cursor-pointer transition-all duration-200 hover:shadow-md"
			onClick={onClick}
		>
			<div className="relative bg-card rounded-lg">
				<div className="flex items-center gap-3 p-3">
					{/* Logo/Icon */}
					<div className="flex-shrink-0">
						<div className={`w-10 h-10 rounded-full flex items-center justify-center border border-border ${
							isOrchestrator
								? "bg-gradient-to-br from-purple-500/10 to-purple-500/10"
								: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
						}`}>
							{isOrchestrator ? (
								<GitMerge className="h-5 w-5 text-purple-600" />
							) : (
								<GitBranch className="h-5 w-5 text-blue-600" />
							)}
						</div>
					</div>

					{/* Content */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-0.5">
							<h3 className="font-semibold text-sm truncate bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
								{workflow?.name || "Untitled Workflow"}
							</h3>
							<Badge
								variant="secondary"
								className={`text-xs px-1.5 py-0 h-5 ${
									isOrchestrator
										? "bg-gradient-to-r from-purple-500/90 to-violet-500/90 text-white border-0"
										: "bg-gradient-to-r from-blue-500/90 to-cyan-500/90 text-white border-0"
								}`}
							>
								{isOrchestrator ? "Orchestrator" : "Sequential"}
							</Badge>
							{isRecentlyRun && (
								<Badge
									variant="secondary"
									className="text-xs px-1.5 py-0 h-5 bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0 flex items-center gap-1"
								>
									<CheckCircle2 className="h-3 w-3" />
									Active
								</Badge>
							)}
						</div>
						<p className="text-xs text-muted-foreground line-clamp-1">
							{getDescription()}
						</p>
					</div>

					{/* Agents */}
					{displayAssistants.length > 0 && (
						<div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
							{displayAssistants.map((a, idx) => (
								<Avatar
									key={(a.id || a.name || idx) as string}
									className="h-7 w-7 ring-2 ring-border/50 group-hover:ring-blue-500/30 transition-all duration-200"
								>
									{a.avatar ? (
										<AvatarImage src={a.avatar} alt={a.name || "Agent"} />
									) : (
										<AvatarFallback className="text-[10px] font-semibold bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-700">
											{(a.name || "AG").slice(0, 2).toUpperCase()}
										</AvatarFallback>
									)}
								</Avatar>
							))}
							{overflow > 0 && (
								<div className="h-7 px-1.5 rounded-full border border-border/50 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 text-[10px] font-semibold flex items-center justify-center text-blue-700 ring-2 ring-border/50 group-hover:ring-blue-500/30 transition-all duration-200">
									+{overflow}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</Card>
	)
}
