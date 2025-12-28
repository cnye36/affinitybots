"use client"

import { useState } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, X } from "lucide-react"
import ReactMarkdown from "react-markdown"

interface ContextPreviewProps {
	previousOutput?: string
	agentName?: string
	timestamp?: Date
}

export function ContextPreview({ previousOutput, agentName, timestamp }: ContextPreviewProps) {
	const { clearContext } = usePlaygroundStore()
	const [isExpanded, setIsExpanded] = useState(true)

	if (!previousOutput) return null

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>Previous Context</Label>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-7 w-7 p-0"
					>
						{isExpanded ? (
							<ChevronDown className="h-4 w-4" />
						) : (
							<ChevronRight className="h-4 w-4" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={clearContext}
						className="h-7 w-7 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{isExpanded && (
				<div className="border rounded-lg bg-muted/30">
					<div className="p-2 border-b bg-muted/50">
						<div className="flex items-center justify-between text-xs">
							<span className="font-medium">{agentName || "Previous Agent"}</span>
							{timestamp && (
								<span className="text-muted-foreground">
									{new Date(timestamp).toLocaleTimeString()}
								</span>
							)}
						</div>
					</div>

					<ScrollArea className="max-h-[200px]">
						<div className="p-3 prose prose-sm dark:prose-invert max-w-none">
							<ReactMarkdown>{previousOutput}</ReactMarkdown>
						</div>
					</ScrollArea>
				</div>
			)}
		</div>
	)
}
