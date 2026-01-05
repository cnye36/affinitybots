"use client"

import React, { useState } from "react"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Step data interface
 */
export interface Step {
	number: number
	title: string
	description: string
	details?: string
	icon?: React.ReactNode
}

export interface StepByStepFlowProps {
	steps: Step[]
	className?: string
	defaultExpanded?: number
}

/**
 * StepByStepFlow Component
 *
 * Interactive vertical stepper showing workflow stages with expandable details.
 * Features numbered steps, progress line, and responsive accordion layout on mobile.
 *
 * @example
 * ```tsx
 * <StepByStepFlow
 *   steps={[
 *     {
 *       number: 1,
 *       title: "Data Collection",
 *       description: "Gather information from multiple sources",
 *       details: "Agent automatically pulls data from APIs, databases, and files",
 *       icon: <DatabaseIcon />,
 *     },
 *     {
 *       number: 2,
 *       title: "Processing",
 *       description: "Analyze and transform data",
 *       details: "AI models process and extract key insights",
 *     },
 *   ]}
 *   defaultExpanded={0}
 * />
 * ```
 */
export function StepByStepFlow({
	steps,
	className,
	defaultExpanded,
}: StepByStepFlowProps) {
	const [expandedStep, setExpandedStep] = useState<number | null>(
		defaultExpanded !== undefined ? defaultExpanded : null,
	)

	const toggleStep = (stepNumber: number) => {
		setExpandedStep(expandedStep === stepNumber ? null : stepNumber)
	}

	return (
		<div className={cn("w-full", className)}>
			{/* Desktop: Vertical Stepper */}
			<div className="hidden md:block relative">
				{/* Progress Line */}
				<div className="absolute left-[23px] top-8 bottom-8 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500" />

				<div className="space-y-0">
					{steps.map((step, index) => {
						const isExpanded = expandedStep === step.number

						return (
							<MotionDiv
								key={step.number}
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: index * 0.1, duration: 0.4 }}
								className="relative"
							>
								<button
									onClick={() => toggleStep(step.number)}
									className={cn(
										"w-full text-left group",
										"focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg",
									)}
									aria-expanded={isExpanded}
									aria-label={`Step ${step.number}: ${step.title}`}
								>
									<div className="flex gap-4 pb-8">
										{/* Step Number Circle */}
										<div className="relative flex-shrink-0">
											<MotionDiv
												whileHover={{ scale: 1.1 }}
												whileTap={{ scale: 0.95 }}
												className={cn(
													"w-12 h-12 rounded-full flex items-center justify-center",
													"bg-gradient-to-br font-bold text-white shadow-lg z-10 relative",
													"transition-all duration-300",
													step.number === 1 && "from-blue-500 to-blue-600",
													step.number > 1 &&
														step.number < steps.length &&
														"from-purple-500 to-purple-600",
													step.number === steps.length && "from-green-500 to-green-600",
													isExpanded && "ring-4 ring-offset-2 ring-offset-background",
													isExpanded && step.number === 1 && "ring-blue-500/30",
													isExpanded && step.number > 1 && step.number < steps.length && "ring-purple-500/30",
													isExpanded && step.number === steps.length && "ring-green-500/30",
												)}
											>
												{step.icon ? (
													<div className="w-5 h-5">{step.icon}</div>
												) : (
													<span className="text-lg">{step.number}</span>
												)}
											</MotionDiv>
										</div>

										{/* Content */}
										<div className="flex-1 pt-1">
											<div className="flex items-start justify-between gap-4">
												<div className="flex-1">
													{/* Title */}
													<h3
														className={cn(
															"text-lg font-semibold mb-1 transition-colors duration-200",
															"text-gray-900 dark:text-gray-100",
															"group-hover:text-blue-600 dark:group-hover:text-blue-400",
														)}
													>
														{step.title}
													</h3>

													{/* Description */}
													<p className="text-sm text-gray-600 dark:text-gray-400">
														{step.description}
													</p>
												</div>

												{/* Expand Icon */}
												{step.details && (
													<div
														className={cn(
															"transition-transform duration-200",
															isExpanded && "rotate-180",
														)}
													>
														<ChevronDown className="w-5 h-5 text-gray-400" />
													</div>
												)}
											</div>

											{/* Expanded Details */}
											{step.details && (
												<MotionDiv
													initial={{ height: 0, opacity: 0 }}
													animate={{
														height: isExpanded ? "auto" : 0,
														opacity: isExpanded ? 1 : 0,
													}}
													transition={{ duration: 0.3 }}
													className="overflow-hidden"
												>
													<div className="mt-3 p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
														<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
															{step.details}
														</p>
													</div>
												</MotionDiv>
											)}
										</div>
									</div>
								</button>
							</MotionDiv>
						)
					})}
				</div>
			</div>

			{/* Mobile: Accordion */}
			<div className="md:hidden space-y-3">
				{steps.map((step, index) => {
					const isExpanded = expandedStep === step.number

					return (
						<MotionDiv
							key={step.number}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05, duration: 0.3 }}
							className={cn(
								"rounded-lg border-2 overflow-hidden transition-all duration-300",
								"bg-white dark:bg-gray-900",
								isExpanded
									? "border-purple-500 shadow-lg shadow-purple-500/20"
									: "border-gray-200 dark:border-gray-800",
							)}
						>
							<button
								onClick={() => toggleStep(step.number)}
								className="w-full text-left p-4 focus:outline-none"
								aria-expanded={isExpanded}
								aria-label={`Step ${step.number}: ${step.title}`}
							>
								<div className="flex items-start gap-3">
									{/* Step Number */}
									<div
										className={cn(
											"w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
											"bg-gradient-to-br font-bold text-white text-sm",
											step.number === 1 && "from-blue-500 to-blue-600",
											step.number > 1 && step.number < steps.length && "from-purple-500 to-purple-600",
											step.number === steps.length && "from-green-500 to-green-600",
										)}
									>
										{step.icon ? (
											<div className="w-4 h-4">{step.icon}</div>
										) : (
											<span>{step.number}</span>
										)}
									</div>

									{/* Content */}
									<div className="flex-1">
										<div className="flex items-start justify-between gap-2">
											<h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
												{step.title}
											</h3>
											{step.details && (
												<ChevronRight
													className={cn(
														"w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0",
														isExpanded && "rotate-90",
													)}
												/>
											)}
										</div>
										<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
											{step.description}
										</p>
									</div>
								</div>
							</button>

							{/* Expanded Details */}
							{step.details && (
								<MotionDiv
									initial={{ height: 0, opacity: 0 }}
									animate={{
										height: isExpanded ? "auto" : 0,
										opacity: isExpanded ? 1 : 0,
									}}
									transition={{ duration: 0.3 }}
									className="overflow-hidden"
								>
									<div className="px-4 pb-4">
										<div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
											<p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
												{step.details}
											</p>
										</div>
									</div>
								</MotionDiv>
							)}
						</MotionDiv>
					)
				})}
			</div>
		</div>
	)
}
