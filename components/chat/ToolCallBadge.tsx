"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Wrench } from "lucide-react"
import * as Collapsible from "@radix-ui/react-collapsible"

interface ToolCall {
	id: string
	name: string
	args?: Record<string, any>
	arguments?: any
	result?: any
}

interface ToolCallBadgeProps {
	toolCall: ToolCall
	className?: string
}

function formatValue(value: any): React.ReactNode {
	if (value === null) return <span className="text-gray-500 dark:text-gray-400">null</span>
	if (value === undefined) return <span className="text-gray-500 dark:text-gray-400">undefined</span>
	if (typeof value === "boolean") return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>
	if (typeof value === "number") return <span className="text-blue-600 dark:text-blue-400">{value}</span>
	if (typeof value === "string") return <span className="text-green-600 dark:text-green-400">"{value}"</span>

	if (Array.isArray(value)) {
		if (value.length === 0) return <span className="text-gray-500 dark:text-gray-400">[]</span>
		return (
			<div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
				{value.map((item, i) => (
					<div key={i} className="py-0.5">
						<span className="text-gray-500 dark:text-gray-400">{i}:</span> {formatValue(item)}
					</div>
				))}
			</div>
		)
	}

	if (typeof value === "object") {
		const entries = Object.entries(value)
		if (entries.length === 0) return <span className="text-gray-500 dark:text-gray-400">{"{}"}</span>
		return (
			<div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
				{entries.map(([key, val]) => (
					<div key={key} className="py-0.5">
						<span className="text-amber-600 dark:text-amber-400 font-medium">{key}:</span> {formatValue(val)}
					</div>
				))}
			</div>
		)
	}

	return String(value)
}

export function ToolCallBadge({ toolCall, className = "" }: ToolCallBadgeProps) {
	const [isOpen, setIsOpen] = useState(false)

	// Parse arguments if they're provided in different formats
	const args = toolCall.args || toolCall.arguments || {}
	const hasArgs = Object.keys(args).length > 0
	const hasResult = toolCall.result !== undefined && toolCall.result !== null

	return (
		<Collapsible.Root
			open={isOpen}
			onOpenChange={setIsOpen}
			className={`group ${className}`}
		>
			<Collapsible.Trigger asChild>
				<button
					className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 hover:border-amber-500/30 text-amber-700 dark:text-amber-300 hover:shadow-sm"
					type="button"
				>
					<Wrench className="h-3 w-3" />
					<span>{toolCall.name}</span>
					{isOpen ? (
						<ChevronDown className="h-3 w-3 transition-transform" />
					) : (
						<ChevronRight className="h-3 w-3 transition-transform" />
					)}
				</button>
			</Collapsible.Trigger>

			<Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
				<div className="mt-2 p-3 rounded-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5 border border-amber-500/10 space-y-3">
					{/* Tool Name */}
					<div className="flex items-center gap-2">
						<span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
							Tool:
						</span>
						<code className="text-xs font-mono bg-amber-500/10 px-2 py-0.5 rounded text-amber-800 dark:text-amber-200">
							{toolCall.name}
						</code>
					</div>

					{/* Arguments */}
					{hasArgs && (
						<div className="space-y-1.5">
							<span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
								Arguments:
							</span>
							<div className="text-xs font-mono bg-black/5 dark:bg-white/5 p-3 rounded border border-gray-200/50 dark:border-gray-700/50">
								{formatValue(args)}
							</div>
						</div>
					)}

					{/* Result */}
					{hasResult && (
						<div className="space-y-1.5">
							<span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
								Result:
							</span>
							<div className="text-xs font-mono bg-black/5 dark:bg-white/5 p-3 rounded border border-gray-200/50 dark:border-gray-700/50 max-h-60 overflow-y-auto">
								{typeof toolCall.result === "string"
									? <span className="text-green-600 dark:text-green-400 break-words">{toolCall.result}</span>
									: formatValue(toolCall.result)}
							</div>
						</div>
					)}

					{!hasArgs && !hasResult && (
						<p className="text-xs text-gray-500 dark:text-gray-400 italic">
							No additional details available
						</p>
					)}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}
