import React, { memo } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, Play, PlusCircle, AlarmClock, Globe2, Sparkles } from "lucide-react"
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
	onOpenTaskSidebar?: () => void,
	onAddTask?: () => void,
	hasConnectedTask?: boolean,
	isActive?: boolean,
}

const statusColors = {
	idle: "bg-gray-400 dark:bg-gray-500",
	running: "bg-blue-500 dark:bg-blue-400 animate-pulse shadow-lg shadow-blue-500/50",
	completed: "bg-emerald-500 dark:bg-emerald-400 shadow-lg shadow-emerald-500/50",
	error: "bg-red-500 dark:bg-red-400 shadow-lg shadow-red-500/50",
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
	const handleSettingsClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (data.onConfigureTrigger) {
			data.onConfigureTrigger(data.trigger_id)
		}
	}

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (data.onConfigureTrigger) {
			data.onConfigureTrigger(data.trigger_id)
		}
	}

	const handleAddTask = (e: React.MouseEvent) => {
		e.stopPropagation()
		// Prefer onAddTask to set active node before opening the sidebar
		if (data.onAddTask) data.onAddTask()
		if (data.onOpenTaskSidebar) data.onOpenTaskSidebar()
	}

	const config = triggerTypeConfig[data.trigger_type]
	const TriggerIcon = config.icon

	return (
		<div className="relative group">
			{/* Glowing border effect on hover/active */}
			<div
				className={cn(
					"absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
					"bg-gradient-to-r blur-sm",
					config.borderGradient,
					data.isActive && "opacity-100 animate-pulse",
					data.status === "running" && "opacity-100",
				)}
			/>

			<Card
				className={cn(
					"relative min-w-[280px] max-w-[320px] cursor-pointer overflow-hidden",
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
						"p-4 relative overflow-hidden",
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
									"p-2 rounded-lg shadow-md",
									"bg-gradient-to-br",
									config.gradient,
									"transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-200",
								)}
							>
								<TriggerIcon className="h-5 w-5 text-white" />
							</div>

							{/* Start Here badge with gradient */}
							<div className="flex flex-col">
								<Badge
									className={cn(
										"px-2 py-0.5 text-xs font-bold border-0 shadow-md",
										"bg-gradient-to-r",
										config.gradient,
										"text-white",
									)}
								>
									Start Here
								</Badge>
								<span className="text-[10px] text-muted-foreground mt-1">Workflow Entry</span>
							</div>
						</div>

						<div className="flex items-center gap-2">
							{/* Status indicator */}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<div
											className={cn(
												"w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-800",
												statusColors[data.status || "idle"],
											)}
										/>
									</TooltipTrigger>
									<TooltipContent>
										<p>Status: {data.status || "idle"}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							{/* Settings button - appears on hover */}
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
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-4 pt-3">
					{/* Trigger type badge */}
					<div className="flex flex-wrap gap-2 mb-3">
						<Badge
							variant="outline"
							className={cn(
								"text-xs font-medium border-2",
								"bg-gradient-to-r shadow-sm",
								config.badgeGradient,
								"border-transparent",
							)}
						>
							{config.label}
						</Badge>
						{data.status && data.status !== "idle" && (
							<Badge
								variant={data.status === "error" ? "destructive" : "secondary"}
								className="text-xs capitalize"
							>
								{data.status}
							</Badge>
						)}
					</div>

					{/* Description text */}
					<p className="text-xs text-muted-foreground leading-relaxed">
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

			{/* Add Agent Button Removed - using global add button now */}

			{/* Source handle with gradient ring */}
			<Handle
				type="source"
				position={Position.Right}
				className={cn(
					"w-3 h-3 border-2 border-white dark:border-gray-800",
					"bg-gradient-to-br shadow-lg",
					config.gradient,
					"transition-transform hover:scale-125",
				)}
				id="trigger-source"
				style={{ right: -6 }}
			/>
		</div>
	)
})

TriggerNode.displayName = "TriggerNode"
