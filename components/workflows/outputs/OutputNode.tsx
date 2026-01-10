import React, { memo } from "react"
import { Handle, Position } from "reactflow"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Eye, Settings } from "lucide-react"
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { OutputNodeData } from "@/types/workflow"

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
}

export const OutputNode = memo(({ data, selected }: { data: OutputNodeData, selected?: boolean }) => {
	const isReadOnly = data.isReadOnly === true
	const status = data.status || "idle"
	const statusInfo = statusConfig[status] || statusConfig.idle

	const handleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (data.onConfigureOutput) {
			data.onConfigureOutput(data.id)
		}
	}

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (data.onConfigureOutput) {
			data.onConfigureOutput(data.id)
		}
	}

	const handleSettingsClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (isReadOnly) return
		if (data.onConfigureOutput) {
			data.onConfigureOutput(data.id)
		}
	}

	// Determine handle position based on workflow type
	const handlePosition = data.workflowType === "orchestrator" ? Position.Top : Position.Left

	return (
		<div className="relative group">
			{/* Glowing border effect on hover/active/status - shows green when completed */}
			<div
				className={cn(
					"absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
					"bg-gradient-to-r blur-sm",
					"pointer-events-none",
					"from-cyan-500/30 to-teal-500/30 dark:from-cyan-400/30 dark:to-teal-400/30",
					data.isActive && "opacity-100 animate-pulse",
					status === "running" && "opacity-100 from-blue-500/50 to-cyan-500/50",
					status === "completed" && "opacity-100 from-emerald-500/50 to-green-500/50",
					status === "error" && "opacity-100 from-red-500/50 to-rose-500/50",
				)}
			/>

				{/* Target handle - can receive connections from tasks */}
				<Handle
					type="target"
					position={handlePosition}
					className="!w-3 !h-3 !border-2 !border-white dark:!border-gray-900 !bg-cyan-500 dark:!bg-cyan-400 !shadow-[0_0_6px_rgba(6,182,212,0.5)] dark:!shadow-[0_0_8px_rgba(34,211,238,0.6)] !rounded-full"
					id="output-target"
					style={
						handlePosition === Position.Top
							? { top: -6 }
							: { left: -6 }
					}
				/>

			<Card
				className={cn(
					"relative min-w-[200px] max-w-[240px] cursor-pointer overflow-hidden",
					"border-2 transition-all duration-300",
					"hover:shadow-xl hover:-translate-y-0.5",
					"!bg-white/90 dark:!bg-gray-900/90 backdrop-blur-sm",
					data.isActive
						? cn("shadow-lg ring-2 ring-cyan-500/50 dark:ring-cyan-400/50", "border-cyan-500/50 dark:border-cyan-400/50")
						: "border-cyan-200/50 dark:border-cyan-800/50",
					selected && "ring-2 ring-cyan-500 ring-offset-2",
					status === "running" && "border-blue-500 dark:border-blue-400",
					status === "completed" && "border-emerald-500 dark:border-emerald-400",
					status === "error" && "border-red-500 dark:border-red-400",
				)}
				onDoubleClick={handleDoubleClick}
			>
				{/* Gradient header with "End" badge */}
				<CardHeader
					className={cn(
						"p-3 relative overflow-hidden",
						data.isActive
							? "bg-white/20 dark:bg-black/20 backdrop-blur-sm"
							: "bg-gradient-to-br from-cyan-50/80 to-teal-50/80 dark:from-cyan-950/30 dark:to-teal-950/30",
					)}
				>
					{/* Subtle animated gradient overlay */}
					<div
						className={cn(
							"absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
							data.isActive && "animate-shimmer",
							status === "running" && "animate-shimmer",
						)}
					/>

					<div className="relative flex items-center justify-between">
						<div className="flex items-center gap-3">
							{/* Icon with gradient background */}
							<div
								className={cn(
									"p-1.5 rounded-lg shadow-md",
									"bg-gradient-to-br from-cyan-500 to-teal-500 dark:from-cyan-600 dark:to-teal-600",
									"transform transition-transform group-hover:scale-110 group-hover:rotate-3 duration-200",
								)}
							>
								<CheckCircle2 className="h-4 w-4 text-white" />
							</div>

							{/* End badge with gradient */}
							<Badge
								className={cn(
									"px-1.5 py-0 text-[10px] font-medium border-0 shadow-sm",
									"bg-gradient-to-r from-cyan-500 to-teal-500 dark:from-cyan-600 dark:to-teal-600",
									"text-white",
								)}
							>
								End
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
											<p>Configure Output</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent className="p-3 pt-2">
					{/* Description text */}
					<p className="text-[11px] text-muted-foreground leading-relaxed mb-2.5">
						{data.description || "Workflow result"}
					</p>

					{/* View button (appears on hover) */}
					{!isReadOnly && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<button
										onClick={handleClick}
										className={cn(
											"w-full flex items-center justify-center gap-1.5 px-2 py-1.5",
											"rounded-md text-xs font-medium",
											"bg-cyan-500/10 hover:bg-cyan-500/20",
											"text-cyan-700 dark:text-cyan-300",
											"border border-cyan-500/20 hover:border-cyan-500/30",
											"transition-all duration-200",
											"opacity-0 group-hover:opacity-100",
										)}
									>
										<Eye className="h-3 w-3" />
										View Result
									</button>
								</TooltipTrigger>
								<TooltipContent>
									<p>View workflow result</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</CardContent>
			</Card>
		</div>
	)
})

OutputNode.displayName = "OutputNode"
