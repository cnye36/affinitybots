"use client"

import React from "react"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { ArrowRight, Play, Zap, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Workflow step type definitions
 */
export type WorkflowStepType = "trigger" | "agent" | "output"

export interface WorkflowStep {
	type: WorkflowStepType
	label: string
	description: string
	icon?: React.ReactNode
}

export interface WorkflowVisualizerProps {
	steps: WorkflowStep[]
	className?: string
}

/**
 * WorkflowVisualizer Component
 *
 * Displays a visual representation of workflow steps with animated arrows showing data flow.
 * Color-coded nodes: Trigger (blue), Agent (purple), Output (green).
 *
 * @example
 * ```tsx
 * <WorkflowVisualizer
 *   steps={[
 *     { type: "trigger", label: "Form Submitted", description: "User fills contact form" },
 *     { type: "agent", label: "Data Processor", description: "Extracts and validates data" },
 *     { type: "output", label: "CRM Updated", description: "Contact added to HubSpot" },
 *   ]}
 * />
 * ```
 */
export function WorkflowVisualizer({ steps, className }: WorkflowVisualizerProps) {
	const getStepColor = (type: WorkflowStepType) => {
		switch (type) {
			case "trigger":
				return {
					bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20",
					border: "border-blue-500/50 dark:border-blue-400/50",
					icon: "text-blue-600 dark:text-blue-400",
					glow: "group-hover:shadow-blue-500/20",
				}
			case "agent":
				return {
					bg: "bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-500/20 dark:to-purple-600/20",
					border: "border-purple-500/50 dark:border-purple-400/50",
					icon: "text-purple-600 dark:text-purple-400",
					glow: "group-hover:shadow-purple-500/20",
				}
			case "output":
				return {
					bg: "bg-gradient-to-br from-green-500/10 to-green-600/10 dark:from-green-500/20 dark:to-green-600/20",
					border: "border-green-500/50 dark:border-green-400/50",
					icon: "text-green-600 dark:text-green-400",
					glow: "group-hover:shadow-green-500/20",
				}
		}
	}

	const getDefaultIcon = (type: WorkflowStepType) => {
		switch (type) {
			case "trigger":
				return <Play className="w-5 h-5" />
			case "agent":
				return <Zap className="w-5 h-5" />
			case "output":
				return <CheckCircle2 className="w-5 h-5" />
		}
	}

	return (
		<div className={cn("w-full", className)}>
			{/* Desktop: Horizontal Layout */}
			<div className="hidden md:flex items-center justify-center gap-0">
				{steps.map((step, index) => {
					const colors = getStepColor(step.type)
					return (
						<React.Fragment key={index}>
							<MotionDiv
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.15, duration: 0.4 }}
								className="group relative"
							>
								<div
									className={cn(
										"min-w-[220px] max-w-[240px] p-4 rounded-xl border-2 backdrop-blur-sm",
										"bg-white/90 dark:bg-gray-900/90 transition-all duration-300",
										"hover:-translate-y-1 hover:shadow-lg",
										colors.border,
										colors.glow,
									)}
								>
									{/* Icon */}
									<div className={cn("mb-3 flex items-center gap-2", colors.icon)}>
										{step.icon || getDefaultIcon(step.type)}
										<span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
											{step.type}
										</span>
									</div>

									{/* Label */}
									<h4 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
										{step.label}
									</h4>

									{/* Description */}
									<p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
										{step.description}
									</p>

									{/* Gradient accent bar */}
									<div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-b-xl", colors.bg)} />
								</div>
							</MotionDiv>

							{/* Animated Arrow */}
							{index < steps.length - 1 && (
								<MotionDiv
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ delay: index * 0.15 + 0.2, duration: 0.3 }}
									className="relative flex items-center px-4"
								>
									<div className="relative">
										<ArrowRight className="w-6 h-6 text-gray-400 dark:text-gray-600" />
										{/* Animated pulse */}
										<MotionDiv
											className="absolute inset-0 flex items-center justify-center"
											animate={{
												opacity: [0.3, 0.7, 0.3],
												scale: [0.9, 1.1, 0.9],
											}}
											transition={{
												duration: 2,
												repeat: Infinity,
												ease: "easeInOut",
											}}
										>
											<ArrowRight className="w-6 h-6 text-blue-500 dark:text-blue-400" />
										</MotionDiv>
									</div>
								</MotionDiv>
							)}
						</React.Fragment>
					)
				})}
			</div>

			{/* Mobile: Vertical Stack */}
			<div className="md:hidden space-y-4">
				{steps.map((step, index) => {
					const colors = getStepColor(step.type)
					return (
						<React.Fragment key={index}>
							<MotionDiv
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1, duration: 0.4 }}
								className="group"
							>
								<div
									className={cn(
										"w-full p-4 rounded-xl border-2 backdrop-blur-sm",
										"bg-white/90 dark:bg-gray-900/90 transition-all duration-300",
										colors.border,
										colors.glow,
									)}
								>
									{/* Icon */}
									<div className={cn("mb-3 flex items-center gap-2", colors.icon)}>
										{step.icon || getDefaultIcon(step.type)}
										<span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
											{step.type}
										</span>
									</div>

									{/* Label */}
									<h4 className="text-sm font-semibold mb-1 text-gray-900 dark:text-gray-100">
										{step.label}
									</h4>

									{/* Description */}
									<p className="text-xs text-gray-600 dark:text-gray-400">
										{step.description}
									</p>

									{/* Gradient accent bar */}
									<div className={cn("absolute bottom-0 left-0 right-0 h-1 rounded-b-xl", colors.bg)} />
								</div>
							</MotionDiv>

							{/* Vertical Arrow */}
							{index < steps.length - 1 && (
								<MotionDiv
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: index * 0.1 + 0.15, duration: 0.3 }}
									className="flex justify-center py-1"
								>
									<MotionDiv
										animate={{
											y: [0, 4, 0],
											opacity: [0.5, 1, 0.5],
										}}
										transition={{
											duration: 1.5,
											repeat: Infinity,
											ease: "easeInOut",
										}}
									>
										<ArrowRight className="w-5 h-5 rotate-90 text-blue-500 dark:text-blue-400" />
									</MotionDiv>
								</MotionDiv>
							)}
						</React.Fragment>
					)
				})}
			</div>
		</div>
	)
}
