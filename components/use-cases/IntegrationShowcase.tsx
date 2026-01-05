"use client"

import React, { useState } from "react"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

/**
 * Integration data interface
 */
export interface Integration {
	name: string
	iconPath: string
	capabilities: string[]
	usedBy: string[]
}

export interface IntegrationShowcaseProps {
	integrations: Integration[]
	className?: string
	highlightOnClick?: boolean
}

/**
 * IntegrationShowcase Component
 *
 * Displays a responsive grid of integration icons with interactive tooltips.
 * Click to highlight which agents use each integration.
 *
 * @example
 * ```tsx
 * <IntegrationShowcase
 *   integrations={[
 *     {
 *       name: "Google Drive",
 *       iconPath: "/integration-icons/google-drive-icon.png",
 *       capabilities: ["File storage", "Document search", "Sharing"],
 *       usedBy: ["Research Assistant", "Content Manager"],
 *     },
 *   ]}
 *   highlightOnClick={true}
 * />
 * ```
 */
export function IntegrationShowcase({
	integrations,
	className,
	highlightOnClick = true,
}: IntegrationShowcaseProps) {
	const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)

	const handleClick = (name: string) => {
		if (highlightOnClick) {
			setSelectedIntegration(selectedIntegration === name ? null : name)
		}
	}

	return (
		<div className={cn("w-full", className)}>
			<TooltipProvider delayDuration={200}>
				{/* Grid Layout */}
				<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
					{integrations.map((integration, index) => {
						const isSelected = selectedIntegration === integration.name
						const isHighlighted = selectedIntegration && !isSelected

						return (
							<MotionDiv
								key={integration.name}
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ delay: index * 0.05, duration: 0.3 }}
								whileHover={{ scale: 1.05, y: -4 }}
								whileTap={{ scale: 0.95 }}
								className="relative"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<button
											onClick={() => handleClick(integration.name)}
											className={cn(
												"group relative w-full aspect-square rounded-xl transition-all duration-300",
												"bg-white dark:bg-gray-900 border-2",
												"hover:shadow-lg hover:border-blue-500/50 dark:hover:border-purple-500/50",
												"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
												"backdrop-blur-sm overflow-hidden",
												isSelected && "border-purple-500 shadow-lg shadow-purple-500/20",
												isHighlighted && "opacity-40 scale-95",
												!isSelected && !isHighlighted && "border-gray-200 dark:border-gray-800",
											)}
											aria-label={`${integration.name} integration`}
										>
											{/* Gradient overlay on hover */}
											<div
												className={cn(
													"absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0",
													"group-hover:from-blue-500/10 group-hover:to-purple-500/10",
													"transition-all duration-300",
													isSelected && "from-purple-500/10 to-pink-500/10",
												)}
											/>

											{/* Icon */}
											<div className="relative w-full h-full flex items-center justify-center p-4">
												<img
													src={integration.iconPath}
													alt={integration.name}
													className={cn(
														"w-full h-full object-contain transition-all duration-300",
														"group-hover:scale-110",
														isSelected && "scale-110",
													)}
													loading="lazy"
												/>
											</div>

											{/* Selected indicator */}
											{isSelected && (
												<MotionDiv
													initial={{ scale: 0 }}
													animate={{ scale: 1 }}
													className="absolute top-2 right-2 w-3 h-3 bg-purple-500 rounded-full border-2 border-white dark:border-gray-900"
												/>
											)}
										</button>
									</TooltipTrigger>

									<TooltipContent
										side="top"
										className="max-w-[250px] p-3 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800"
									>
										{/* Integration name */}
										<div className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
											{integration.name}
										</div>

										{/* Capabilities */}
										{integration.capabilities.length > 0 && (
											<div className="mb-2">
												<div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
													Capabilities:
												</div>
												<div className="flex flex-wrap gap-1">
													{integration.capabilities.slice(0, 3).map((cap) => (
														<Badge
															key={cap}
															variant="secondary"
															className="text-[10px] px-1.5 py-0 h-5"
														>
															{cap}
														</Badge>
													))}
													{integration.capabilities.length > 3 && (
														<Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
															+{integration.capabilities.length - 3}
														</Badge>
													)}
												</div>
											</div>
										)}

										{/* Used by agents */}
										{integration.usedBy.length > 0 && (
											<div>
												<div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
													Used by:
												</div>
												<div className="space-y-1">
													{integration.usedBy.slice(0, 3).map((agent) => (
														<div
															key={agent}
															className="text-xs text-gray-700 dark:text-gray-300 truncate"
														>
															• {agent}
														</div>
													))}
													{integration.usedBy.length > 3 && (
														<div className="text-xs text-gray-500 dark:text-gray-500">
															+{integration.usedBy.length - 3} more
														</div>
													)}
												</div>
											</div>
										)}

										{highlightOnClick && (
											<div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-800">
												<p className="text-[10px] text-gray-500 dark:text-gray-500">
													Click to highlight usage
												</p>
											</div>
										)}
									</TooltipContent>
								</Tooltip>
							</MotionDiv>
						)
					})}
				</div>

				{/* Selected integration info */}
				{selectedIntegration && highlightOnClick && (
					<MotionDiv
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						className="mt-6 p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50"
					>
						<div className="flex items-start justify-between gap-4">
							<div className="flex-1">
								<h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
									{selectedIntegration} is used by:
								</h4>
								<div className="flex flex-wrap gap-2">
									{integrations
										.find((i) => i.name === selectedIntegration)
										?.usedBy.map((agent) => (
											<Badge key={agent} variant="secondary" className="text-xs">
												{agent}
											</Badge>
										))}
								</div>
							</div>
							<button
								onClick={() => setSelectedIntegration(null)}
								className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
								aria-label="Clear selection"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									strokeWidth="2"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
								</svg>
							</button>
						</div>
					</MotionDiv>
				)}
			</TooltipProvider>
		</div>
	)
}
