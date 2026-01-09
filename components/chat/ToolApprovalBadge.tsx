"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, AlertCircle, Check, X, Shield } from "lucide-react"
import * as Collapsible from "@radix-ui/react-collapsible"
import { Button } from "@/components/ui/button"

interface ToolCall {
	id: string
	name: string
	args?: Record<string, any>
	arguments?: any
	mcpServer?: string
}

interface ToolApprovalBadgeProps {
	toolCalls: ToolCall[]
	onApprove: (approvedTools: ToolCall[], approvalType: "once" | "always-tool" | "always-integration") => void
	onDeny: () => void
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

export function ToolApprovalBadge({ toolCalls, onApprove, onDeny, className = "" }: ToolApprovalBadgeProps) {
	const [isOpen, setIsOpen] = useState(true)
	const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(toolCalls.map(tc => tc.id)))

	// Get unique MCP servers
	const mcpServers = Array.from(new Set(toolCalls.map(tc => tc.mcpServer).filter(Boolean)))
	const singleIntegration = mcpServers.length === 1 ? mcpServers[0] : null

	const handleApprove = (approvalType: "once" | "always-tool" | "always-integration") => {
		const approvedTools = toolCalls.filter(tc => selectedTools.has(tc.id))
		onApprove(approvedTools, approvalType)
	}

	return (
		<Collapsible.Root
			open={isOpen}
			onOpenChange={setIsOpen}
			className={`group ${className}`}
		>
			<div className="inline-flex flex-col gap-2 max-w-full">
				{/* Header Badge */}
				<Collapsible.Trigger asChild>
					<button
						className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 bg-gradient-to-r from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 border border-orange-500/30 hover:border-orange-500/40 text-orange-700 dark:text-orange-300 hover:shadow-sm animate-pulse"
						type="button"
					>
						<AlertCircle className="h-3 w-3" />
						<span>Tool Approval Required ({toolCalls.length})</span>
						{isOpen ? (
							<ChevronDown className="h-3 w-3 transition-transform" />
						) : (
							<ChevronRight className="h-3 w-3 transition-transform" />
						)}
					</button>
				</Collapsible.Trigger>

				{/* Expanded Content */}
				<Collapsible.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
					<div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/5 to-red-500/5 border border-orange-500/20 space-y-3">
						{/* Tool List */}
						<div className="space-y-2">
							{toolCalls.map((tool) => {
								const args = tool.args || tool.arguments || {}
								const hasArgs = Object.keys(args).length > 0

								return (
									<div key={tool.id} className="bg-black/5 dark:bg-white/5 rounded p-2 space-y-2">
										<div className="flex items-center gap-2">
											<input
												type="checkbox"
												id={tool.id}
												checked={selectedTools.has(tool.id)}
												onChange={(e) => {
													const newSelected = new Set(selectedTools)
													if (e.target.checked) {
														newSelected.add(tool.id)
													} else {
														newSelected.delete(tool.id)
													}
													setSelectedTools(newSelected)
												}}
												className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
											/>
											<label htmlFor={tool.id} className="text-xs font-semibold text-orange-700 dark:text-orange-300 cursor-pointer">
												{tool.name}
											</label>
											{tool.mcpServer && (
												<span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
													{tool.mcpServer}
												</span>
											)}
										</div>

										{hasArgs && (
											<div className="ml-5 text-xs font-mono bg-black/5 dark:bg-white/5 p-2 rounded border border-gray-200/50 dark:border-gray-700/50">
												{formatValue(args)}
											</div>
										)}
									</div>
								)
							})}
						</div>

						{/* Approval Buttons */}
						<div className="flex flex-col gap-2 pt-2 border-t border-orange-500/20">
							<div className="flex gap-2">
								<Button
									size="sm"
									variant="outline"
									onClick={onDeny}
									className="flex-shrink-0 h-7 text-xs"
								>
									<X className="h-3 w-3 mr-1" />
									Deny
								</Button>
								<Button
									size="sm"
									variant="secondary"
									onClick={() => handleApprove("once")}
									disabled={selectedTools.size === 0}
									className="flex-1 h-7 text-xs"
								>
									<Check className="h-3 w-3 mr-1" />
									Once ({selectedTools.size})
								</Button>
							</div>

							<div className="flex gap-2">
								<Button
									size="sm"
									variant="default"
									onClick={() => handleApprove("always-tool")}
									disabled={selectedTools.size === 0}
									className="flex-1 h-7 text-xs bg-orange-500 hover:bg-orange-600"
								>
									<Check className="h-3 w-3 mr-1" />
									Always {selectedTools.size === 1 ? "This Tool" : "These Tools"}
								</Button>

								{singleIntegration && (
									<Button
										size="sm"
										variant="default"
										onClick={() => handleApprove("always-integration")}
										disabled={selectedTools.size === 0}
										className="flex-1 h-7 text-xs bg-orange-600 hover:bg-orange-700"
									>
										<Shield className="h-3 w-3 mr-1" />
										Trust Integration
									</Button>
								)}
							</div>
						</div>
					</div>
				</Collapsible.Content>
			</div>
		</Collapsible.Root>
	)
}
