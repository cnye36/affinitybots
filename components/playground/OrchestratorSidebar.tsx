"use client"

import { useState, useEffect } from "react"
import { Assistant } from "@/types/assistant"
import { OrchestratorConfig } from "@/types/workflow"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, ChevronDown, ChevronUp, Maximize } from "lucide-react"
import { getLlmLabel } from "@/lib/llm/catalog"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"

interface OrchestratorSidebarProps {
	orchestratorConfig: OrchestratorConfig | null
	onOrchestratorConfigChange: (config: OrchestratorConfig) => void
	availableAgents: Assistant[]
	selectedTeam: string[]
	onTeamChange: (agentIds: string[]) => void
	instructions: string
	onInstructionsChange: (instructions: string) => void
}

const DEFAULT_SYSTEM_PROMPT = `You are a manager coordinating a team of specialized AI agents.

Your role:
- Analyze the user's goal and break it down into subtasks
- Delegate tasks to the most appropriate agent based on their capabilities
- Review each agent's output and decide on the next step
- Signal completion when the goal is achieved

Available agents will be listed for each task. Choose the right agent for each subtask.

Response format:
To delegate: {"agent": "agent_name", "instruction": "what to do"}
To complete: {"complete": true, "final_result": "summary"}`

export function OrchestratorSidebar({
	orchestratorConfig,
	onOrchestratorConfigChange,
	availableAgents,
	selectedTeam,
	onTeamChange,
	instructions,
	onInstructionsChange,
}: OrchestratorSidebarProps) {
	const [systemPrompt, setSystemPrompt] = useState(
		orchestratorConfig?.manager?.system_prompt || DEFAULT_SYSTEM_PROMPT
	)
	const [model, setModel] = useState(orchestratorConfig?.manager?.model || "gpt-5")
	const [isAgentDropdownOpen, setIsAgentDropdownOpen] = useState(false)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [dialogDraft, setDialogDraft] = useState("")

	// Update config when form values change
	useEffect(() => {
		const newConfig: OrchestratorConfig = {
			manager: {
				system_prompt: systemPrompt,
				user_prompt: instructions || "Complete the user's request by coordinating the available agents.",
				model: model,
				temperature: orchestratorConfig?.manager?.temperature || 0.3,
				reasoningEffort: orchestratorConfig?.manager?.reasoningEffort || "medium",
			},
			execution: {
				max_iterations: orchestratorConfig?.execution?.max_iterations || 10,
				require_completion_signal: true,
			},
		}
		onOrchestratorConfigChange(newConfig)
	}, [systemPrompt, model, instructions])

	const toggleAgent = (agentId: string) => {
		if (selectedTeam.includes(agentId)) {
			onTeamChange(selectedTeam.filter(id => id !== agentId))
		} else {
			onTeamChange([...selectedTeam, agentId])
		}
	}

	const selectedAgents = availableAgents.filter(a => selectedTeam.includes(a.assistant_id))

	return (
		<div className="space-y-4">
			{/* Orchestrator Configuration */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Orchestrator Configuration</CardTitle>
					<CardDescription className="text-xs">
						Configure the manager agent that coordinates the team
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Model Selection */}
					<div className="space-y-2">
						<Label htmlFor="orchestrator-model">Model</Label>
						<Select value={model} onValueChange={setModel}>
							<SelectTrigger id="orchestrator-model">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="gpt-5">GPT-5</SelectItem>
								<SelectItem value="gpt-5-mini">GPT-5 Mini</SelectItem>
								<SelectItem value="claude-3-7-sonnet-20250219">Claude 3.7 Sonnet</SelectItem>
								<SelectItem value="claude-opus-4-5-20251101">Claude Opus 4.5</SelectItem>
								<SelectItem value="gemini-2.0-flash-exp">Gemini 2.0 Flash</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* System Prompt */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="system-prompt">System Prompt</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onClick={() => {
									setDialogDraft(systemPrompt)
									setIsDialogOpen(true)
								}}
								className="h-7 text-xs gap-1"
							>
								<Maximize className="h-3 w-3" />
								Expand
							</Button>
						</div>
						<Textarea
							id="system-prompt"
							value={systemPrompt}
							onChange={(e) => setSystemPrompt(e.target.value)}
							rows={8}
							className="font-mono text-xs flex w-full rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 resize-y transition-all"
							style={{ minHeight: "120px" }}
							placeholder={DEFAULT_SYSTEM_PROMPT}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Instructions */}
			<Card>
				<CardHeader>
					<CardTitle className="text-sm">Instructions</CardTitle>
					<CardDescription className="text-xs">
						The task or goal for the orchestrator to complete
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Textarea
						value={instructions}
						onChange={(e) => onInstructionsChange(e.target.value)}
						placeholder="Enter the task you want the orchestrator to coordinate..."
						rows={4}
						className="resize-none"
					/>
				</CardContent>
			</Card>

			{/* Agent Selection */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-sm">Team Members</CardTitle>
							<CardDescription className="text-xs">
								Select agents the orchestrator can delegate to
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="h-6 w-6"
							onClick={() => setIsAgentDropdownOpen(!isAgentDropdownOpen)}
						>
							{isAgentDropdownOpen ? (
								<ChevronUp className="h-4 w-4" />
							) : (
								<ChevronDown className="h-4 w-4" />
							)}
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{/* Selected Agents Preview (when closed) */}
					{!isAgentDropdownOpen && selectedAgents.length > 0 && (
						<div className="space-y-2 mb-4">
							<div className="text-xs text-muted-foreground">
								{selectedAgents.length} agent{selectedAgents.length !== 1 ? "s" : ""} selected
							</div>
							<div className="flex flex-wrap gap-2">
								{selectedAgents.map((agent) => (
									<div
										key={agent.assistant_id}
										className="flex items-center gap-2 px-2 py-1 bg-muted rounded text-xs"
									>
										{agent.metadata?.agent_avatar ? (
											<img
												src={agent.metadata.agent_avatar}
												alt={agent.name}
												className="h-4 w-4 rounded-full"
											/>
										) : (
											<Bot className="h-3 w-3" />
										)}
										<span className="font-medium">{agent.name}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Agent List (when open) */}
					{isAgentDropdownOpen && (
						<ScrollArea className="h-[200px]">
							<div className="space-y-2">
								{availableAgents.length === 0 ? (
									<div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg">
										<Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
										<p className="text-sm">No agents available</p>
										<p className="text-xs mt-1">Create some agents first</p>
									</div>
								) : (
									availableAgents.map((agent) => (
										<label
											key={agent.assistant_id}
											className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer"
										>
											<Checkbox
												checked={selectedTeam.includes(agent.assistant_id)}
												onCheckedChange={() => toggleAgent(agent.assistant_id)}
												className="mt-0.5"
											/>
											<div className="flex-1 min-w-0">
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
													<span className="font-medium text-sm">{agent.name}</span>
												</div>
												{agent.metadata?.description && (
													<p className="text-xs text-muted-foreground line-clamp-2 mt-1">
														{agent.metadata.description}
													</p>
												)}
											</div>
										</label>
									))
								)}
							</div>
						</ScrollArea>
					)}
				</CardContent>
			</Card>

			{/* Expand Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-4xl h-[85vh] flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-xl bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
							Orchestrator System Prompt Editor
						</DialogTitle>
						<DialogDescription>
							Edit the orchestrator manager's system prompt with a larger view
						</DialogDescription>
					</DialogHeader>

					<div className="flex-1 flex flex-col min-h-0 mt-4">
						<Textarea
							value={dialogDraft}
							onChange={(e) => setDialogDraft(e.target.value)}
							placeholder={DEFAULT_SYSTEM_PROMPT}
							className="flex-1 w-full rounded-lg border border-violet-200/50 dark:border-violet-800/50 bg-background px-4 py-3 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 resize-none"
						/>
					</div>

					<div className="flex items-center justify-end gap-2 mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => setIsDialogOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							onClick={() => {
								setSystemPrompt(dialogDraft)
								setIsDialogOpen(false)
							}}
							className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
						>
							Save Changes
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}

