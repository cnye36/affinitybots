"use client"

import React, { useState } from "react"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bot, Sparkles } from "lucide-react"
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
	color?: "blue" | "purple" | "green" | "orange"
	avatar?: string
}

export interface AgentCardProps {
	agent: AgentCardData
	className?: string
	enableModal?: boolean
}

/**
 * AgentCard Component
 *
 * Interactive 3D flip card showcasing AI agent configurations.
 * Features hover flip animation, gradient borders, and optional expandable modal.
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
 *   enableModal={true}
 * />
 * ```
 */
export function AgentCard({ agent, className, enableModal = false }: AgentCardProps) {
	const [isFlipped, setIsFlipped] = useState(false)
	const [showModal, setShowModal] = useState(false)

	const colorSchemes = {
		blue: {
			gradient: "from-blue-500 via-blue-600 to-cyan-500",
			glow: "shadow-blue-500/20 hover:shadow-blue-500/40",
			text: "text-blue-600 dark:text-blue-400",
		},
		purple: {
			gradient: "from-purple-500 via-purple-600 to-pink-500",
			glow: "shadow-purple-500/20 hover:shadow-purple-500/40",
			text: "text-purple-600 dark:text-purple-400",
		},
		green: {
			gradient: "from-green-500 via-emerald-600 to-teal-500",
			glow: "shadow-green-500/20 hover:shadow-green-500/40",
			text: "text-green-600 dark:text-green-400",
		},
		orange: {
			gradient: "from-orange-500 via-orange-600 to-amber-500",
			glow: "shadow-orange-500/20 hover:shadow-orange-500/40",
			text: "text-orange-600 dark:text-orange-400",
		},
	}

	const colors = colorSchemes[agent.color || "purple"]

	const handleClick = () => {
		if (enableModal) {
			setShowModal(true)
		}
	}

	return (
		<>
			<MotionDiv
				className={cn("perspective-1000", className)}
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<div
					className="relative w-full h-[280px] cursor-pointer"
					onMouseEnter={() => setIsFlipped(true)}
					onMouseLeave={() => setIsFlipped(false)}
					onClick={handleClick}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleClick()
						}
					}}
					aria-label={`${agent.name} agent card`}
				>
					{/* Card Container */}
					<MotionDiv
						className="relative w-full h-full preserve-3d"
						animate={{ rotateY: isFlipped ? 180 : 0 }}
						transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
						style={{ transformStyle: "preserve-3d" }}
					>
						{/* Front Face */}
						<div
							className="absolute w-full h-full backface-hidden"
							style={{ backfaceVisibility: "hidden" }}
						>
							<div
								className={cn(
									"w-full h-full rounded-xl p-[2px] transition-all duration-300",
									"bg-gradient-to-br",
									colors.gradient,
									colors.glow,
									"hover:shadow-lg",
								)}
							>
								<div className="w-full h-full rounded-xl bg-white dark:bg-gray-900 p-6 flex flex-col items-center justify-center text-center">
									{/* Avatar/Icon */}
									<div className={cn("mb-4 relative")}>
										{agent.avatar ? (
											<img
												src={agent.avatar}
												alt={agent.name}
												className="w-16 h-16 rounded-full object-cover"
											/>
										) : (
											<div
												className={cn(
													"w-16 h-16 rounded-full flex items-center justify-center",
													"bg-gradient-to-br",
													colors.gradient,
												)}
											>
												<Bot className="w-8 h-8 text-white" />
											</div>
										)}
										<div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
									</div>

									{/* Name */}
									<h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
										{agent.name}
									</h3>

									{/* Role */}
									<p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
										{agent.role}
									</p>

									{/* Hint */}
									<div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
										<Sparkles className="w-3 h-3" />
										<span>Hover to see details</span>
									</div>
								</div>
							</div>
						</div>

						{/* Back Face */}
						<div
							className="absolute w-full h-full backface-hidden"
							style={{
								backfaceVisibility: "hidden",
								transform: "rotateY(180deg)",
							}}
						>
							<div
								className={cn(
									"w-full h-full rounded-xl p-[2px] transition-all duration-300",
									"bg-gradient-to-br",
									colors.gradient,
									colors.glow,
									"hover:shadow-lg",
								)}
							>
								<div className="w-full h-full rounded-xl bg-white dark:bg-gray-900 p-6 flex flex-col">
									{/* Model */}
									<div className="mb-4">
										<div className="flex items-center gap-2 mb-1">
											<span className="text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
												Model
											</span>
										</div>
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
										<p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
											{agent.description}
										</p>
									</div>

									{/* Click hint if modal enabled */}
									{enableModal && (
										<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
											<p className="text-xs text-center text-gray-500 dark:text-gray-500">
												Click to view full details
											</p>
										</div>
									)}
								</div>
							</div>
						</div>
					</MotionDiv>
				</div>
			</MotionDiv>

			{/* Modal for expanded view */}
			{enableModal && (
				<Dialog open={showModal} onOpenChange={setShowModal}>
					<DialogContent className="max-w-md">
						<DialogHeader>
							<DialogTitle className="flex items-center gap-3">
								{agent.avatar ? (
									<img
										src={agent.avatar}
										alt={agent.name}
										className="w-10 h-10 rounded-full object-cover"
									/>
								) : (
									<div
										className={cn(
											"w-10 h-10 rounded-full flex items-center justify-center",
											"bg-gradient-to-br",
											colors.gradient,
										)}
									>
										<Bot className="w-5 h-5 text-white" />
									</div>
								)}
								<div>
									<div className="font-bold">{agent.name}</div>
									<div className="text-sm font-normal text-gray-600 dark:text-gray-400">
										{agent.role}
									</div>
								</div>
							</DialogTitle>
						</DialogHeader>

						<div className="space-y-4">
							{/* Model */}
							<div>
								<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
									AI Model
								</h4>
								<Badge variant="secondary" className="font-mono">
									{agent.model}
								</Badge>
							</div>

							{/* Tools */}
							<div>
								<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
									Integrated Tools
								</h4>
								<div className="flex flex-wrap gap-2">
									{agent.tools.map((tool, idx) => (
										<div
											key={idx}
											className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800"
										>
											{typeof tool.icon === "string" ? (
												<img src={tool.icon} alt={tool.name} className="w-5 h-5 object-contain" />
											) : (
												<div className="w-5 h-5">{tool.icon}</div>
											)}
											<span className="text-sm font-medium text-gray-700 dark:text-gray-300">
												{tool.name}
											</span>
										</div>
									))}
								</div>
							</div>

							{/* Description */}
							<div>
								<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
									Description
								</h4>
								<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
									{agent.description}
								</p>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			)}

			<style jsx global>{`
				.perspective-1000 {
					perspective: 1000px;
				}
				.preserve-3d {
					transform-style: preserve-3d;
				}
				.backface-hidden {
					-webkit-backface-visibility: hidden;
					backface-visibility: hidden;
				}
			`}</style>
		</>
	)
}
