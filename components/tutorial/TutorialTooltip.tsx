"use client"

import React, { useEffect, useState, useRef } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TutorialStep, TutorialPosition } from "@/types/tutorial"

interface TutorialTooltipProps {
	/**
	 * Current tutorial step
	 */
	step: TutorialStep

	/**
	 * Current step number (1-indexed for display)
	 */
	currentStep: number

	/**
	 * Total number of steps
	 */
	totalSteps: number

	/**
	 * Callback when next button is clicked
	 */
	onNext: () => void

	/**
	 * Callback when back button is clicked
	 */
	onBack: () => void

	/**
	 * Callback when skip/close button is clicked
	 */
	onSkip: () => void

	/**
	 * Whether the back button should be disabled
	 */
	canGoBack: boolean
}

/**
 * Calculate tooltip position relative to target element
 */
function calculateTooltipPosition(
	targetElement: HTMLElement | null,
	tooltipElement: HTMLElement | null,
	preferredPosition: TutorialPosition = "bottom"
): { top: number, left: number, position: TutorialPosition } {
	if (!targetElement || !tooltipElement) {
		return { top: 0, left: 0, position: preferredPosition }
	}

	const targetRect = targetElement.getBoundingClientRect()
	const tooltipRect = tooltipElement.getBoundingClientRect()
	const padding = 16
	const arrowSize = 8

	let top = 0
	let left = 0
	let finalPosition = preferredPosition

	// Calculate based on preferred position
	switch (preferredPosition) {
		case "top":
			top = targetRect.top - tooltipRect.height - padding - arrowSize
			left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)

			// Check if tooltip would go off-screen at top
			if (top < padding) {
				finalPosition = "bottom"
				top = targetRect.bottom + padding + arrowSize
			}
			break

		case "bottom":
			top = targetRect.bottom + padding + arrowSize
			left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2)

			// Check if tooltip would go off-screen at bottom
			if (top + tooltipRect.height > window.innerHeight - padding) {
				finalPosition = "top"
				top = targetRect.top - tooltipRect.height - padding - arrowSize
			}
			break

		case "left":
			top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
			left = targetRect.left - tooltipRect.width - padding - arrowSize

			// Check if tooltip would go off-screen on left
			if (left < padding) {
				finalPosition = "right"
				left = targetRect.right + padding + arrowSize
			}
			break

		case "right":
			top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2)
			left = targetRect.right + padding + arrowSize

			// Check if tooltip would go off-screen on right
			if (left + tooltipRect.width > window.innerWidth - padding) {
				finalPosition = "left"
				left = targetRect.left - tooltipRect.width - padding - arrowSize
			}
			break
	}

	// Ensure tooltip doesn't go off-screen horizontally
	if (left < padding) {
		left = padding
	} else if (left + tooltipRect.width > window.innerWidth - padding) {
		left = window.innerWidth - tooltipRect.width - padding
	}

	// Ensure tooltip doesn't go off-screen vertically
	if (top < padding) {
		top = padding
	} else if (top + tooltipRect.height > window.innerHeight - padding) {
		top = window.innerHeight - tooltipRect.height - padding
	}

	return { top, left, position: finalPosition }
}

/**
 * TutorialTooltip Component
 * Displays tutorial step content with navigation controls
 */
export function TutorialTooltip({
	step,
	currentStep,
	totalSteps,
	onNext,
	onBack,
	onSkip,
	canGoBack,
}: TutorialTooltipProps) {
	const tooltipRef = useRef<HTMLDivElement>(null)
	const [position, setPosition] = useState<{ top: number, left: number, position: TutorialPosition }>({
		top: 0,
		left: 0,
		position: step.position || "bottom",
	})
	const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

	// Find and track the target element
	useEffect(() => {
		const findTarget = () => {
			const element = document.querySelector(step.target) as HTMLElement
			if (element) {
				setTargetElement(element)
			} else {
				console.warn(`Tutorial target element not found: ${step.target}`)
			}
		}

		// Initial find
		findTarget()

		// Set up observer to watch for DOM changes
		const observer = new MutationObserver(findTarget)
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})

		return () => observer.disconnect()
	}, [step.target])

	// Update tooltip position
	useEffect(() => {
		const updatePosition = () => {
			if (targetElement && tooltipRef.current) {
				const newPosition = calculateTooltipPosition(
					targetElement,
					tooltipRef.current,
					step.position || "bottom"
				)
				setPosition(newPosition)

				// Scroll target into view if needed
				const rect = targetElement.getBoundingClientRect()
				const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight

				if (!isInView) {
					targetElement.scrollIntoView({
						behavior: "smooth",
						block: "center",
					})
				}
			}
		}

		updatePosition()

		// Update on resize or scroll
		window.addEventListener("resize", updatePosition)
		window.addEventListener("scroll", updatePosition, true)

		return () => {
			window.removeEventListener("resize", updatePosition)
			window.removeEventListener("scroll", updatePosition, true)
		}
	}, [targetElement, step.position])

	const isLastStep = currentStep === totalSteps

	return (
		<div
			ref={tooltipRef}
			className={cn(
				"fixed z-[9999] w-full max-w-md",
				"bg-background border border-border rounded-lg shadow-2xl",
				"animate-in fade-in-0 zoom-in-95 duration-200"
			)}
			style={{
				top: `${position.top}px`,
				left: `${position.left}px`,
			}}
		>
			{/* Arrow pointer */}
			<div
				className={cn(
					"absolute w-4 h-4 bg-background border-border rotate-45",
					{
						"top-[-8px] left-1/2 -translate-x-1/2 border-l border-t": position.position === "bottom",
						"bottom-[-8px] left-1/2 -translate-x-1/2 border-r border-b": position.position === "top",
						"left-[-8px] top-1/2 -translate-y-1/2 border-l border-b": position.position === "right",
						"right-[-8px] top-1/2 -translate-y-1/2 border-r border-t": position.position === "left",
					}
				)}
			/>

			{/* Content */}
			<div className="relative p-6">
				{/* Close button */}
				<button
					onClick={onSkip}
					className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
					aria-label="Close tutorial"
				>
					<X className="h-4 w-4" />
				</button>

				{/* Progress badge */}
				<Badge variant="outline" className="mb-3">
					Step {currentStep} of {totalSteps}
				</Badge>

				{/* Title */}
				<h3 className="text-lg font-semibold mb-2 pr-8">
					{step.title}
				</h3>

				{/* Content */}
				<p className="text-sm text-muted-foreground mb-6 leading-relaxed">
					{step.content}
				</p>

				{/* Navigation buttons */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						{canGoBack && (
							<Button
								variant="outline"
								size="sm"
								onClick={onBack}
								className="gap-1"
							>
								<ChevronLeft className="h-4 w-4" />
								Back
							</Button>
						)}
					</div>

					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onSkip}
						>
							Skip Tutorial
						</Button>
						<Button
							size="sm"
							onClick={onNext}
							className="gap-1"
						>
							{isLastStep ? "Finish" : "Next"}
							{!isLastStep && <ChevronRight className="h-4 w-4" />}
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
