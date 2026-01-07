"use client"

import React from "react"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { Badge } from "@/components/ui/badge"
import { Bot } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Agent card data interface
 */
export interface AgentCardData {
	name: string
	role: string
	model: string
	tools: Array<{
		name: string
		icon: React.ReactNode | string
	}>
	description: string
	color?: "blue" | "purple" | "green" | "orange" | "cyan" | "indigo" | "violet"
	avatar?: string
}

export interface AgentCardProps {
	agent: AgentCardData
	className?: string
}

/**
 * AgentCard Component
 *
 * Clean, single-sided card showcasing AI agent configurations.
 * Features gradient borders, colored icon backgrounds for personality.
 *
 * @example
 * ```tsx
 * <AgentCard
 *   agent={{
 *     name: "Sales Assistant",
 *     role: "Lead Qualification Specialist",
 *     model: "GPT-4",
 *     tools: [
 *       { name: "HubSpot", icon: <HubspotIcon /> },
 *       { name: "Gmail", icon: <GmailIcon /> },
 *     ],
 *     description: "Qualifies leads and updates CRM automatically",
 *     color: "purple",
 *   }}
 * />
 * ```
 */
export function AgentCard({ agent, className }: AgentCardProps) {
	const colorSchemes = {
		blue: {
			gradient: "from-blue-500 via-blue-600 to-cyan-500",
			glow: "shadow-blue-500/20 hover:shadow-blue-500/40",
			text: "text-blue-600 dark:text-blue-400",
			iconBg: "bg-gradient-to-br from-blue-500 to-blue-600",
		},
		purple: {
			gradient: "from-purple-500 via-purple-600 to-pink-500",
			glow: "shadow-purple-500/20 hover:shadow-purple-500/40",
			text: "text-purple-600 dark:text-purple-400",
			iconBg: "bg-gradient-to-br from-purple-500 to-purple-600",
		},
		violet: {
			gradient: "from-violet-500 via-violet-600 to-purple-500",
			glow: "shadow-violet-500/20 hover:shadow-violet-500/40",
			text: "text-violet-600 dark:text-violet-400",
			iconBg: "bg-gradient-to-br from-violet-500 to-violet-600",
		},
		green: {
			gradient: "from-green-500 via-emerald-600 to-teal-500",
			glow: "shadow-green-500/20 hover:shadow-green-500/40",
			text: "text-green-600 dark:text-green-400",
			iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
		},
		orange: {
			gradient: "from-orange-500 via-orange-600 to-amber-500",
			glow: "shadow-orange-500/20 hover:shadow-orange-500/40",
			text: "text-orange-600 dark:text-orange-400",
			iconBg: "bg-gradient-to-br from-orange-500 to-orange-600",
		},
		cyan: {
			gradient: "from-cyan-500 via-cyan-600 to-blue-500",
			glow: "shadow-cyan-500/20 hover:shadow-cyan-500/40",
			text: "text-cyan-600 dark:text-cyan-400",
			iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-600",
		},
		indigo: {
			gradient: "from-indigo-500 via-indigo-600 to-purple-500",
			glow: "shadow-indigo-500/20 hover:shadow-indigo-500/40",
			text: "text-indigo-600 dark:text-indigo-400",
			iconBg: "bg-gradient-to-br from-indigo-500 to-indigo-600",
		},
	}

	const colors = colorSchemes[agent.color || "purple"]

	return (
		<MotionDiv
			className={cn("h-full", className)}
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4 }}
		>
			<div
				className={cn(
					"h-full rounded-xl p-[2px] transition-all duration-300",
					"bg-gradient-to-br",
					colors.gradient,
					colors.glow,
					"hover:shadow-xl",
				)}
			>
				<div className="h-full rounded-xl bg-white dark:bg-gray-900 p-6 flex flex-col">
					{/* Icon with colored background */}
					<div className="mb-4">
						{agent.avatar ? (
							<img
								src={agent.avatar}
								alt={agent.name}
								className="w-16 h-16 rounded-xl object-cover"
							/>
						) : (
							<div
								className={cn(
									"w-16 h-16 rounded-xl flex items-center justify-center shadow-lg",
									colors.iconBg,
								)}
							>
								<Bot className="w-8 h-8 text-white" />
							</div>
						)}
					</div>

					{/* Name & Role */}
					<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
						{agent.name}
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
						{agent.role}
					</p>

					{/* Model Badge */}
					<div className="mb-4">
						<Badge variant="secondary" className="font-mono text-xs">
							{agent.model}
						</Badge>
					</div>

					{/* Tools */}
					<div className="mb-4">
						<div className="flex items-center gap-2 mb-2">
							<span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
								Tools
							</span>
						</div>
						<div className="flex flex-wrap gap-2">
							{agent.tools.slice(0, 3).map((tool, idx) => (
								<div
									key={idx}
									className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800"
									title={tool.name}
								>
									{typeof tool.icon === "string" ? (
										<img src={tool.icon} alt={tool.name} className="w-4 h-4 object-contain" />
									) : (
										<div className="w-4 h-4">{tool.icon}</div>
									)}
									<span className="text-xs font-medium text-gray-700 dark:text-gray-300">
										{tool.name}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* Description */}
					<div className="flex-1">
						<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
							{agent.description}
						</p>
					</div>
				</div>
			</div>
		</MotionDiv>
	)
}

AgentCard.displayName = "AgentCard"
