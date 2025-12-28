"use client"

import { Assistant } from "@/types/assistant"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Bot } from "lucide-react"

interface AgentSelectorProps {
	agents: Assistant[]
	currentAgentId: string | null
	onSelectAgent: (agentId: string) => void
}

export function AgentSelector({ agents, currentAgentId, onSelectAgent }: AgentSelectorProps) {
	if (agents.length === 0) {
		return (
			<div className="space-y-2">
				<Label>Agent</Label>
				<div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
					<Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
					<p>No agents available</p>
					<p className="text-xs mt-1">Create an agent first</p>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			<Label htmlFor="agent-select">Select Agent</Label>
			<Select value={currentAgentId || undefined} onValueChange={onSelectAgent}>
				<SelectTrigger id="agent-select">
					<SelectValue placeholder="Choose an agent..." />
				</SelectTrigger>
				<SelectContent>
					{agents.map((agent) => (
						<SelectItem key={agent.assistant_id} value={agent.assistant_id}>
							<div className="flex items-center gap-2">
								{agent.metadata?.agent_avatar ? (
									<img
										src={agent.metadata.agent_avatar}
										alt={agent.name}
										className="h-5 w-5 rounded-full"
									/>
								) : (
									<Bot className="h-4 w-4" />
								)}
								<div>
									<div className="font-medium">{agent.name}</div>
									{agent.metadata?.description && (
										<div className="text-xs text-muted-foreground line-clamp-1">
											{agent.metadata.description}
										</div>
									)}
								</div>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	)
}
