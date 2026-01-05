"use client"

import React, { useEffect, useRef, useState } from "react"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { useInView } from "framer-motion"
import { cn } from "@/lib/utils"

/**
 * Metric counter data interface
 */
export interface MetricCounterProps {
	value: number | string
	suffix?: string
	prefix?: string
	label: string
	description?: string
	duration?: number
	className?: string
	gradientFrom?: string
	gradientTo?: string
}

/**
 * MetricCounter Component
 *
 * Animated counter that triggers when scrolled into view.
 * Supports percentages, multipliers (3x), and large numbers with smooth count-up animations.
 *
 * @example
 * ```tsx
 * <MetricCounter
 *   value={85}
 *   suffix="%"
 *   label="Accuracy Rate"
 *   description="Average AI response accuracy"
 *   gradientFrom="from-blue-600"
 *   gradientTo="to-purple-600"
 * />
 *
 * <MetricCounter
 *   value={3}
 *   suffix="x"
 *   label="Faster Processing"
 *   description="Compared to manual workflows"
 * />
 * ```
 */
export function MetricCounter({
	value,
	suffix = "",
	prefix = "",
	label,
	description,
	duration = 2000,
	className,
	gradientFrom = "from-blue-600",
	gradientTo = "to-purple-600",
}: MetricCounterProps) {
	const ref = useRef<HTMLDivElement>(null)
	const isInView = useInView(ref, { once: true, margin: "-100px" })
	const [displayValue, setDisplayValue] = useState<number | string>(0)

	useEffect(() => {
		if (!isInView) return

		// If value is a string, just display it after delay
		if (typeof value === "string") {
			const timer = setTimeout(() => {
				setDisplayValue(value)
			}, 100)
			return () => clearTimeout(timer)
		}

		// Animate number count-up
		const startTime = Date.now()
		const endValue = value

		const animate = () => {
			const now = Date.now()
			const elapsed = now - startTime
			const progress = Math.min(elapsed / duration, 1)

			// Easing function (easeOutCubic)
			const eased = 1 - Math.pow(1 - progress, 3)
			const current = Math.floor(eased * endValue)

			setDisplayValue(current)

			if (progress < 1) {
				requestAnimationFrame(animate)
			} else {
				setDisplayValue(endValue)
			}
		}

		requestAnimationFrame(animate)
	}, [isInView, value, duration])

	const formatValue = (val: number | string): string => {
		if (typeof val === "string") return val

		// Format large numbers with commas
		if (val >= 1000) {
			return val.toLocaleString()
		}

		return val.toString()
	}

	return (
		<MotionDiv
			ref={ref}
			initial={{ opacity: 0, y: 20 }}
			animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
			transition={{ duration: 0.5 }}
			className={cn("text-center", className)}
		>
			{/* Counter Display */}
			<div className="mb-3">
				<MotionDiv
					initial={{ scale: 0.5 }}
					animate={isInView ? { scale: 1 } : { scale: 0.5 }}
					transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
					className={cn(
						"text-5xl sm:text-6xl md:text-7xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
						gradientFrom,
						gradientTo,
					)}
				>
					{prefix}
					{formatValue(displayValue)}
					{suffix}
				</MotionDiv>
			</div>

			{/* Label */}
			<h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
				{label}
			</h3>

			{/* Description */}
			{description && (
				<p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs mx-auto">
					{description}
				</p>
			)}

			{/* Animated underline */}
			<MotionDiv
				initial={{ width: 0 }}
				animate={isInView ? { width: "100%" } : { width: 0 }}
				transition={{ delay: 0.3, duration: 0.6 }}
				className="mt-4 h-1 max-w-[100px] mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
			/>
		</MotionDiv>
	)
}

/**
 * MetricCounterGrid Component
 *
 * Responsive grid layout for multiple metric counters.
 *
 * @example
 * ```tsx
 * <MetricCounterGrid
 *   metrics={[
 *     { value: 95, suffix: "%", label: "Accuracy" },
 *     { value: 5, suffix: "x", label: "Speed" },
 *     { value: 10000, suffix: "+", label: "Tasks Completed" },
 *   ]}
 * />
 * ```
 */
export interface MetricCounterGridProps {
	metrics: Array<Omit<MetricCounterProps, "className">>
	className?: string
	columns?: 2 | 3 | 4
}

export function MetricCounterGrid({
	metrics,
	className,
	columns = 3,
}: MetricCounterGridProps) {
	const gridCols = {
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
		4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
	}

	return (
		<div className={cn("grid gap-8 md:gap-12", gridCols[columns], className)}>
			{metrics.map((metric, index) => (
				<MetricCounter
					key={index}
					{...metric}
					className="p-6 rounded-xl bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow duration-300"
				/>
			))}
		</div>
	)
}
