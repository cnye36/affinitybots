"use client"

import { useState, useEffect } from "react"
import { Assistant } from "@/types/assistant"
import { OrchestratorConfig } from "@/types/workflow"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, Sparkles } from "lucide-react"

interface OrchestratorConfigFormProps {
	config: OrchestratorConfig | null
	availableAgents: Assistant[]
	onConfigChange: (config: OrchestratorConfig) => void
	onTeamChange: (agentIds: string[]) => void
	selectedTeam?: string[]
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

const DEFAULT_USER_PROMPT = "Complete the user's request by coordinating the available agents."

export function OrchestratorConfigForm({
	config,
	availableAgents,
	onConfigChange,
	onTeamChange,
	selectedTeam = [],
}: OrchestratorConfigFormProps) {
	const [managerModel, setManagerModel] = useState(config?.manager?.model || "gpt-5")
	const [systemPrompt, setSystemPrompt] = useState(config?.manager?.system_prompt || DEFAULT_SYSTEM_PROMPT)
	const [userPrompt, setUserPrompt] = useState(config?.manager?.user_prompt || DEFAULT_USER_PROMPT)
	const [temperature, setTemperature] = useState(config?.manager?.temperature || 0.3)
	const [reasoningEffort, setReasoningEffort] = useState<"low" | "medium" | "high">(
		config?.manager?.reasoningEffort || "medium"
	)
	const [maxIterations, setMaxIterations] = useState(config?.execution?.max_iterations || 10)
	const [teamAgentIds, setTeamAgentIds] = useState<string[]>(selectedTeam)

	// Update config whenever form values change
	useEffect(() => {
		const newConfig: OrchestratorConfig = {
			manager: {
				system_prompt: systemPrompt,
				user_prompt: userPrompt,
				model: managerModel,
				temperature,
				reasoningEffort,
			},
			execution: {
				max_iterations: maxIterations,
				require_completion_signal: true,
			},
		}
		onConfigChange(newConfig)
	}, [systemPrompt, userPrompt, managerModel, temperature, reasoningEffort, maxIterations])

	// Update team whenever selection changes
	useEffect(() => {
		onTeamChange(teamAgentIds)
	}, [teamAgentIds])

	const toggleAgent = (agentId: string) => {
		setTeamAgentIds(prev =>
			prev.includes(agentId) ? prev.filter(id => id !== agentId) : [...prev, agentId]
		)
	}

	const selectAllAgents = () => {
		setTeamAgentIds(availableAgents.map(a => a.assistant_id))
	}

	const clearAllAgents = () => {
		setTeamAgentIds([])
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<Sparkles className="h-4 w-4" />
						Manager Configuration
					</CardTitle>
					<CardDescription className="text-xs">
						Configure the manager agent that will coordinate your team
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Model Selection */}
					<div className="space-y-2">
						<Label htmlFor="manager-model">Manager Model</Label>
						<Select value={managerModel} onValueChange={setManagerModel}>
							<SelectTrigger id="manager-model">
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

					{/* Temperature */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="temperature">Temperature</Label>
							<span className="text-sm text-muted-foreground">{temperature}</span>
						</div>
						<Slider
							id="temperature"
							min={0}
							max={1}
							step={0.1}
							value={[temperature]}
							onValueChange={(value) => setTemperature(value[0])}
						/>
					</div>

					{/* Reasoning Effort */}
					<div className="space-y-2">
						<Label htmlFor="reasoning-effort">Reasoning Effort</Label>
						<Select
							value={reasoningEffort}
							onValueChange={(value: "low" | "medium" | "high") => setReasoningEffort(value)}
						>
							<SelectTrigger id="reasoning-effort">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="low">Low</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="high">High</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* System Prompt */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="system-prompt">System Prompt</Label>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setSystemPrompt(DEFAULT_SYSTEM_PROMPT)}
								className="h-7 text-xs"
							>
								Reset
							</Button>
						</div>
						<Textarea
							id="system-prompt"
							value={systemPrompt}
							onChange={(e) => setSystemPrompt(e.target.value)}
							rows={8}
							className="font-mono text-xs"
						/>
					</div>

					{/* User Prompt/Goal */}
					<div className="space-y-2">
						<Label htmlFor="user-prompt">Default Goal</Label>
						<Textarea
							id="user-prompt"
							value={userPrompt}
							onChange={(e) => setUserPrompt(e.target.value)}
							rows={2}
							placeholder="What should the manager accomplish?"
						/>
					</div>

					{/* Max Iterations */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="max-iterations">Max Iterations</Label>
							<span className="text-sm text-muted-foreground">{maxIterations}</span>
						</div>
						<Slider
							id="max-iterations"
							min={1}
							max={20}
							step={1}
							value={[maxIterations]}
							onValueChange={(value) => setMaxIterations(value[0])}
						/>
						<p className="text-xs text-muted-foreground">
							Maximum number of agent delegations before stopping
						</p>
					</div>
				</CardContent>
			</Card>

			{/* Team Selection */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="text-sm flex items-center gap-2">
								<Bot className="h-4 w-4" />
								Team Members ({teamAgentIds.length})
							</CardTitle>
							<CardDescription className="text-xs">
								Select agents the manager can delegate to
							</CardDescription>
						</div>
						<div className="flex gap-1">
							<Button variant="ghost" size="sm" onClick={selectAllAgents} className="h-7 text-xs">
								All
							</Button>
							<Button variant="ghost" size="sm" onClick={clearAllAgents} className="h-7 text-xs">
								Clear
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					{availableAgents.length === 0 ? (
						<div className="text-center text-muted-foreground p-4 border border-dashed rounded-lg">
							<Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
							<p className="text-sm">No agents available</p>
							<p className="text-xs mt-1">Create some agents first</p>
						</div>
					) : (
						<ScrollArea className="h-[200px]">
							<div className="space-y-2">
								{availableAgents.map((agent) => (
									<label
										key={agent.assistant_id}
										className="flex items-start gap-3 p-2 rounded hover:bg-accent cursor-pointer"
									>
										<Checkbox
											checked={teamAgentIds.includes(agent.assistant_id)}
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
								))}
							</div>
						</ScrollArea>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
