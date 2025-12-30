"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GitBranch, GitMerge, CheckCircle2 } from "lucide-react"

interface WorkflowListItemProps {
	workflow: any
	onDelete: (e: React.MouseEvent, workflowId: string, workflowName: string) => void
	onClick: () => void
}

export function WorkflowListItem({ workflow, onDelete, onClick }: WorkflowListItemProps) {
	const nodes: any[] = Array.isArray(workflow?.nodes) ? (workflow.nodes as any[]) : []
	const taskNodes = nodes.filter((n) => (n?.type ?? "task") === "task")
	const nodeCount = (taskNodes.length || nodes.length || 0) as number

	// Check if workflow was run recently
	const isRecentlyRun = workflow?.last_run_at &&
		new Date().getTime() - new Date(workflow.last_run_at).getTime() < 24 * 60 * 60 * 1000

	const workflowType = workflow?.workflow_type || "sequential"
	const isOrchestrator = workflowType === "orchestrator"

	const getDescription = () => {
		const parts = []
		parts.push(`${nodeCount} ${nodeCount === 1 ? "node" : "nodes"}`)
		if (workflow?.last_run_at) {
			const lastRun = formatRelativeTime(workflow.last_run_at)
			parts.push(`Last run: ${lastRun}`)
		}
		return parts.join(" • ")
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
						<p className="text-xs text-muted-foreground line-clamp-2">
							{getDescription()}
						</p>
					</div>
				</div>
			</div>
		</Card>
	)
}
