"use client"

import React, { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TutorialSpotlightProps {
	/**
	 * CSS selector for the element to highlight
	 */
	target: string

	/**
	 * Whether to show the spotlight
	 */
	active: boolean

	/**
	 * Callback when backdrop is clicked
	 */
	onBackdropClick?: () => void
}

/**
 * TutorialSpotlight Component
 * Creates a spotlight effect by darkening everything except the target element
 */
export function TutorialSpotlight({ target, active, onBackdropClick }: TutorialSpotlightProps) {
	const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
	const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)

	useEffect(() => {
		if (!active) {
			setTargetRect(null)
			setTargetElement(null)
			return
		}

		const updateSpotlight = () => {
			const element = document.querySelector(target) as HTMLElement
			if (element) {
				setTargetElement(element)
				const rect = element.getBoundingClientRect()
				setTargetRect(rect)
			} else {
				console.warn(`Tutorial spotlight target not found: ${target}`)
				setTargetRect(null)
				setTargetElement(null)
			}
		}

		// Initial update
		updateSpotlight()

		// Update on resize or scroll
		window.addEventListener("resize", updateSpotlight)
		window.addEventListener("scroll", updateSpotlight, true)

		// Set up observer to watch for DOM changes (only structural changes, not attributes)
		const observer = new MutationObserver(updateSpotlight)
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		})

		return () => {
			window.removeEventListener("resize", updateSpotlight)
			window.removeEventListener("scroll", updateSpotlight, true)
			observer.disconnect()
		}
	}, [target, active])

	if (!active || !targetRect) {
		return null
	}

	const padding = 8 // Padding around the highlighted element

	return (
		<>
			{/* Backdrop overlay - four sections surrounding the highlighted element */}
			<div className="fixed inset-0 z-[9998] pointer-events-none">
				{/* Top section */}
				<div
					className="absolute inset-x-0 top-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
					style={{ height: `${targetRect.top - padding}px` }}
					onClick={onBackdropClick}
				/>

				{/* Bottom section */}
				<div
					className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
					style={{
						top: `${targetRect.bottom + padding}px`,
					}}
					onClick={onBackdropClick}
				/>

				{/* Left section */}
				<div
					className="absolute left-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
					style={{
						top: `${targetRect.top - padding}px`,
						bottom: `${window.innerHeight - targetRect.bottom - padding}px`,
						width: `${targetRect.left - padding}px`,
					}}
					onClick={onBackdropClick}
				/>

				{/* Right section */}
				<div
					className="absolute right-0 bg-black/60 backdrop-blur-[2px] transition-all duration-300 pointer-events-auto"
					style={{
						top: `${targetRect.top - padding}px`,
						bottom: `${window.innerHeight - targetRect.bottom - padding}px`,
						left: `${targetRect.right + padding}px`,
					}}
					onClick={onBackdropClick}
				/>

				{/* Highlight border around the target element */}
				<div
					className={cn(
						"absolute border-2 border-primary rounded-lg transition-all duration-300",
						"shadow-[0_0_0_4px_rgba(var(--primary)_/_0.1)]",
						"animate-pulse"
					)}
					style={{
						top: `${targetRect.top - padding}px`,
						left: `${targetRect.left - padding}px`,
						width: `${targetRect.width + padding * 2}px`,
						height: `${targetRect.height + padding * 2}px`,
					}}
				/>
			</div>
		</>
	)
}
