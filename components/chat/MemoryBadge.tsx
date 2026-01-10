"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Brain } from "lucide-react"
import * as Collapsible from "@radix-ui/react-collapsible"
import type { EnhancedMemory } from "@/types/memory"
import { CATEGORY_INFO, formatImportance } from "@/lib/memory/formatting"

interface MemoryBadgeProps {
	memory: EnhancedMemory
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
			<div className="space-y-0.5">
				{value.map((item, i) => (
					<div key={i}>
						<span className="text-gray-500 dark:text-gray-400">{i}:</span> {formatValue(item)}
					</div>
				))}
			</div>
		)
	}

	return String(value)
}

export function MemoryBadge({ memory, className = "" }: MemoryBadgeProps) {
	const [isOpen, setIsOpen] = useState(false)

	const categoryInfo = CATEGORY_INFO[memory.category]
	const importanceInfo = formatImportance(memory.importance)
	const hasKeyFacts = memory.key_facts && memory.key_facts.length > 0

	return (
		<Collapsible.Root
			open={isOpen}
			onOpenChange={setIsOpen}
			className={`group ${className}`}
		>
			<Collapsible.Trigger asChild>
				<button
					className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 hover:from-purple-500/20 hover:to-indigo-500/20 border border-purple-500/20 hover:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:shadow-sm"
					type="button"
				>
					<Brain className="h-3 w-3" />
					<span>Saved to memory</span>
					{isOpen ? (
						<ChevronDown className="h-3 w-3 transition-transform" />
					) : (
						<ChevronRight className="h-3 w-3 transition-transform" />
					)}
				</button>
			</Collapsible.Trigger>

			<Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
				<div className="mt-2 p-3 rounded-lg bg-gradient-to-br from-purple-500/5 to-indigo-500/5 border border-purple-500/10 space-y-3">
					{/* Title */}
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1">
							<h4 className="text-sm font-semibold text-purple-900 dark:text-purple-100">
								{memory.title}
							</h4>
						</div>
						<div className="flex items-center gap-1.5">
							<span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-${categoryInfo.color}-500/10 border border-${categoryInfo.color}-500/20 text-${categoryInfo.color}-600 dark:text-${categoryInfo.color}-400 font-medium`}>
								{categoryInfo.label}
							</span>
							<span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-${importanceInfo.color}-500/10 border border-${importanceInfo.color}-500/20 text-${importanceInfo.color}-600 dark:text-${importanceInfo.color}-400 font-medium`}>
								{importanceInfo.label}
							</span>
						</div>
					</div>

					{/* Content */}
					<div className="space-y-1.5">
						<span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
							Memory:
						</span>
						<p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
							{memory.content}
						</p>
					</div>

					{/* Context */}
					{memory.context && (
						<div className="space-y-1.5">
							<span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
								Context:
							</span>
							<p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed italic">
								{memory.context}
							</p>
						</div>
					)}

					{/* Key Facts */}
					{hasKeyFacts && (
						<div className="space-y-1.5">
							<span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
								Key Facts:
							</span>
							<div className="text-xs bg-black/5 dark:bg-white/5 p-3 rounded border border-gray-200/50 dark:border-gray-700/50 space-y-1.5">
								{memory.key_facts.map((fact, idx) => (
									<div key={idx} className="flex items-start gap-2">
										<span className="text-purple-600 dark:text-purple-400 font-medium shrink-0">
											{fact.attribute}:
										</span>
										<span className="text-gray-700 dark:text-gray-300">
											{formatValue(fact.value)}
										</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Footer note */}
					<div className="pt-2 border-t border-purple-500/10">
						<p className="text-[10px] text-purple-600 dark:text-purple-400 italic">
							This information has been saved and will be remembered in future conversations.
						</p>
					</div>
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	)
}
