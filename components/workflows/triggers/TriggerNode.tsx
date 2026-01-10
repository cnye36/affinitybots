import React, { memo, useState } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Play, PlusCircle, AlarmClock, Globe2, Sparkles, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface TriggerNodeData {
	name: string,
	description?: string,
	trigger_type: "manual" | "webhook" | "form" | "integration" | "schedule",
	trigger_id: string,
	workflow_id: string,
	config: Record<string, unknown>,
	status?: "idle" | "running" | "completed" | "error",
	onConfigureTrigger?: (triggerId: string) => void,
	onAddTask?: () => void,
	hasConnectedTask?: boolean,
	isActive?: boolean,
	isReadOnly?: boolean,
	workflowType?: "sequential" | "orchestrator",
	onDelete?: () => void,
}

const statusConfig: Record<string, { color: string, glow: string }> = {
	idle: {
		color: "bg-gray-400 dark:bg-gray-500",
		glow: "",
	},
	running: {
		color: "bg-blue-500 dark:bg-blue-400",
		glow: "shadow-lg shadow-blue-500/50 animate-pulse",
	},
	completed: {
		color: "bg-emerald-500 dark:bg-emerald-400",
		glow: "shadow-lg shadow-emerald-500/50",
	},
	error: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
	},
	testing: {
		color: "bg-yellow-500 dark:bg-yellow-400",
		glow: "shadow-lg shadow-yellow-500/50 animate-pulse",
	},
	testSuccess: {
		color: "bg-emerald-500 dark:bg-emerald-400",
		glow: "shadow-lg shadow-emerald-500/50",
	},
	testError: {
		color: "bg-red-500 dark:bg-red-400",
		glow: "shadow-lg shadow-red-500/50",
	},
}

const triggerTypeConfig = {
	schedule: {
		label: "Schedule",
		gradient: "from-orange-500 to-amber-500 dark:from-orange-600 dark:to-amber-600",
		badgeGradient: "from-orange-500/10 to-amber-500/10 dark:from-orange-400/20 dark:to-amber-400/20",
		borderGradient: "from-orange-500/30 to-amber-500/30 dark:from-orange-400/30 dark:to-amber-400/30",
		icon: AlarmClock,
	},
	webhook: {
		label: "Webhook",
		gradient: "from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
		badgeGradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/20",
		borderGradient: "from-blue-500/30 to-cyan-500/30 dark:from-blue-400/30 dark:to-cyan-400/30",
		icon: Globe2,
	},
	manual: {
		label: "Manual Trigger",
		gradient: "from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600",
		badgeGradient: "from-blue-500/10 to-cyan-500/10 dark:from-blue-400/20 dark:to-cyan-400/20",
		borderGradient: "from-blue-500/30 to-cyan-500/30 dark:from-blue-400/30 dark:to-cyan-400/30",
		icon: Play,
	},
	integration: {
		label: "Integration",
		gradient: "from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600",
		badgeGradient: "from-purple-500/10 to-pink-500/10 dark:from-purple-400/20 dark:to-pink-400/20",
		borderGradient: "from-purple-500/30 to-pink-500/30 dark:from-purple-400/30 dark:to-pink-400/30",
		icon: Sparkles,
	},
	form: {
		label: "Form",
		gradient: "from-indigo-500 to-blue-500 dark:from-indigo-600 dark:to-blue-600",
		badgeGradient: "from-indigo-500/10 to-blue-500/10 dark:from-indigo-400/20 dark:to-blue-400/20",
		borderGradient: "from-indigo-500/30 to-blue-500/30 dark:from-indigo-400/30 dark:to-blue-400/30",
		icon: Play,
	},
}

export const TriggerNode = memo(({ data }: { data: TriggerNodeData }) => {
	const [testStatus, setTestStatus] = useState<"idle" | "testing" | "testSuccess" | "testError">("idle")
	const isReadOnly = data.isReadOnly === true

	const handleSettingsClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (isReadOnly) return
		if (data.onConfigureTrigger) {
			data.onConfigureTrigger(data.trigger_id)
		}
	}

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (isReadOnly) return
		if (data.onConfigureTrigger) {
			data.onConfigureTrigger(data.trigger_id)
		}
	}

	const handleAddTask = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (isReadOnly) return
		// Directly open agent selection modal
		if (data.onAddTask) data.onAddTask()
	}

	const handlePlayClick = async (e: React.MouseEvent) => {
		e.stopPropagation()
		if (isReadOnly) return
		setTestStatus("testing")
		try {
			const response = await fetch(`/api/workflows/${data.workflow_id}/execute`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					triggerId: data.trigger_id,
				}),
			})

			if (!response.ok) {
				throw new Error("Failed to execute workflow")
			}

			// Read the stream to completion
			const reader = response.body?.getReader()
			if (reader) {
				const decoder = new TextDecoder()
				while (true) {
					const { done } = await reader.read()
					if (done) break
				}
			}

			setTestStatus("testSuccess")
			setTimeout(() => setTestStatus("idle"), 3000)
		} catch (error) {
			console.error("Error testing trigger:", error)
			setTestStatus("testError")
			setTimeout(() => setTestStatus("idle"), 3000)
		}
	}

	const handleDeleteClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (data.onDelete) {
			data.onDelete()
		}
	}

	const config = triggerTypeConfig[data.trigger_type]
	const TriggerIcon = config.icon
	const status = data.status || "idle"
	const displayStatus = testStatus !== "idle" ? testStatus : status
	const statusInfo = statusConfig[displayStatus] || statusConfig.idle

	return (
		<div className="relative group">
			{/* Status indicator and action buttons - positioned outside top-right */}
			<div className="absolute -top-8 right-0 flex items-center gap-2 z-20">
				{/* Play button for testing */}
				{!isReadOnly && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									onClick={handlePlayClick}
									className={cn(
										"p-1.5 rounded-lg",
										"bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
										"hover:bg-white dark:hover:bg-gray-700",
										"transition-all duration-200 hover:scale-110",
										"shadow-md border border-gray-200 dark:border-gray-700",
										testStatus === "testing" && "opacity-50 cursor-not-allowed",
									)}
									disabled={testStatus === "testing"}
								>
									<Play className="h-3 w-3 text-gray-700 dark:text-gray-300 fill-current" />
								</button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Test Trigger</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}

				{/* Status indicator dot - positioned next to play button */}
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div
								className={cn(
									"w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-900",
									statusInfo.color,
									statusInfo.glow,
								)}
							/>
						</TooltipTrigger>
						<TooltipContent>
							<p className="capitalize">Status: {displayStatus}</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>

				{/* Delete button */}
				{data.onDelete && !isReadOnly && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									onClick={handleDeleteClick}
									className={cn(
										"p-1.5 rounded-lg",
										"bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm",
										"hover:bg-red-50 dark:hover:bg-red-900/20",
										"transition-all duration-200 hover:scale-110",
										"shadow-md border border-gray-200 dark:border-gray-700",
									)}
								>
									<Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
								</button>
							</TooltipTrigger>
							<TooltipContent>
								<p>Delete Trigger</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</div>
			{/* Glowing border effect on hover/active/status */}
			<div
				className={cn(
					"absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
					"bg-gradient-to-r blur-sm",
					"pointer-events-none",
					config.borderGradient,
					data.isActive && "opacity-100 animate-pulse",
					data.status === "running" && "opacity-100 from-blue-500/50 to-cyan-500/50",
					data.status === "completed" && "opacity-100 from-emerald-500/50 to-green-500/50",
					data.status === "error" && "opacity-100 from-red-500/50 to-rose-500/50",
				)}
			/>

			<Card
				className={cn(
					"relative min-w-[200px] max-w-[240px] cursor-pointer overflow-hidden",
					"border-2 transition-all duration-300",
					"hover:shadow-xl hover:-translate-y-0.5",
					data.isActive
						? cn("shadow-lg ring-2 ring-blue-500/50 dark:ring-blue-400/50", "border-blue-500/50 dark:border-blue-400/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm")
						: "border-blue-200/50 dark:border-blue-800/50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm",
				)}
				onDoubleClick={handleDoubleClick}
			>
				{/* Gradient header with "Start Here" badge */}
				<CardHeader
					className={cn(
						"p-3 relative overflow-hidden",
						data.isActive
							? "bg-white/20 dark:bg-black/20 backdrop-blur-sm"
							: cn("bg-gradient-to-br", config.badgeGradient),
					)}
				>
					{/* Subtle animated gradient overlay */}
					<div
						className={cn(
							"absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
							data.isActive && "animate-shimmer",
						)}
					/>

					<div className="relative flex items-center justify-between">
						<div className="flex items-center gap-3">
							{/* Icon with gradient background */}
							<div
								className={cn(
									"p-1.5 rounded-lg shadow-md",
									"bg-gradient-to-br",
									config.gradient,
									"transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-200",
								)}
							>
								<TriggerIcon className="h-4 w-4 text-white" />
							</div>

							{/* Start Here badge with gradient */}
							<Badge
								className={cn(
									"px-1.5 py-0 text-[10px] font-medium border-0 shadow-sm",
									"bg-gradient-to-r",
									config.gradient,
									"text-white",
								)}
							>
								Start Here
							</Badge>
						</div>

						<div className="flex items-center gap-2">
							{/* Settings button - appears on hover */}
							{!isReadOnly && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<button
												onClick={handleSettingsClick}
												className={cn(
													"p-1.5 rounded-lg opacity-0 group-hover:opacity-100",
													"bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm",
													"hover:bg-white dark:hover:bg-gray-700",
													"transition-all duration-200 hover:scale-110",
													"shadow-md",
												)}
											>
												<Settings className="h-4 w-4 text-gray-600 dark:text-gray-300" />
											</button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Configure Trigger</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-3 pt-2">
					{/* Trigger type badge */}
					<div className="flex flex-wrap gap-1.5 mb-2.5">
						<Badge
							variant="outline"
							className={cn(
								"text-[10px] font-medium border px-1.5 py-0",
								"bg-gradient-to-r shadow-sm",
								config.badgeGradient,
								"border-transparent",
							)}
						>
							{config.label}
						</Badge>
					</div>

					{/* Description text */}
					<p className="text-[11px] text-muted-foreground leading-relaxed">
						{data.trigger_type === "manual" &&
							"This workflow will start when manually triggered."}
						{data.trigger_type === "webhook" &&
							"This workflow starts when an authenticated webhook is received."}
						{data.trigger_type === "schedule" && (
							<span>
								This workflow starts on schedule
								{typeof (data.config as any)?.cron === "string"
									? ` (${String((data.config as any).cron)})`
									: ""}
								.
							</span>
						)}
						{data.trigger_type === "integration" &&
							"This workflow starts when a configured integration event occurs."}
						{data.trigger_type === "form" &&
							"This workflow starts when your form is submitted."}
					</p>
				</CardContent>
			</Card>

			{/* Add Agent Button - appears on hover when no outgoing connection */}
			{data.onAddTask && !isReadOnly && (
				<button
					onClick={handleAddTask}
					className={cn(
						"absolute -right-32 top-1/2 -translate-y-1/2",
						"opacity-0 group-hover:opacity-100 transition-opacity duration-200",
						"px-3 py-1.5 rounded-lg",
						"bg-gradient-to-r",
						config.gradient,
						"hover:shadow-lg shadow-md text-white",
						"flex items-center gap-1.5 text-xs font-medium",
						"whitespace-nowrap z-10",
						"backdrop-blur-sm",
					)}
					title="Add Agent"
				>
					<PlusCircle className="w-3.5 h-3.5" />
					<span>Add Agent</span>
				</button>
			)}

			{/* Source handle - RIGHT for horizontal flow */}
			<Handle
				type="source"
				position={Position.Right}
				className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-blue-500 dark:!bg-blue-400 !shadow-[0_0_6px_rgba(59,130,246,0.5)] dark:!shadow-[0_0_8px_rgba(96,165,250,0.6)] !rounded-full"
				id="trigger-source"
				style={{ right: -6 }}
			/>
		</div>
	)
})

TriggerNode.displayName = "TriggerNode"
