"use client"

import { useState, useEffect, useRef } from "react"
import { OrchestratorConfig } from "@/types/workflow"
import { Assistant } from "@/types/assistant"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Loader2, ArrowRight } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Client } from "@langchain/langgraph-sdk"

interface OrchestratorChatProps {
	sessionId: string
	orchestratorConfig: OrchestratorConfig
	selectedTeam: string[]
	instructions: string
	availableAgents: Assistant[]
}

type OrchestratorStep = {
	type: "manager" | "agent"
	agentId?: string
	agentName?: string
	content: string
	timestamp: Date
}

export function OrchestratorChat({
	sessionId,
	orchestratorConfig,
	selectedTeam,
	instructions,
	availableAgents,
}: OrchestratorChatProps) {
	const [steps, setSteps] = useState<OrchestratorStep[]>([])
	const [isExecuting, setIsExecuting] = useState(false)
	const [isPaused, setIsPaused] = useState(false)
	const [currentStep, setCurrentStep] = useState<"manager" | "agent" | null>(null)
	const [threadId, setThreadId] = useState<string | null>(null)
	const [nextAgentId, setNextAgentId] = useState<string | null>(null)
	const clientRef = useRef<Client | null>(null)
	const runStreamRef = useRef<AsyncIterable<any> | null>(null)

	// Initialize client
	useEffect(() => {
		clientRef.current = new Client({
			apiUrl: process.env.NEXT_PUBLIC_LANGGRAPH_API_URL || "http://localhost:8123",
			apiKey: process.env.LANGSMITH_API_KEY,
		})
	}, [])

	// Build available agents map
	const buildAvailableAgents = () => {
		const availableAgentsMap: Record<string, any> = {}
		selectedTeam.forEach((agentId) => {
			const agent = availableAgents.find((a) => a.assistant_id === agentId)
			if (agent) {
				availableAgentsMap[agent.name] = {
					assistant_id: agentId,
					name: agent.name,
					description: agent.metadata?.description || "",
					config: {},
				}
			}
		})
		return availableAgentsMap
	}

	const executeOrchestrator = async (resume: boolean = false) => {
		if (!clientRef.current) return

		try {
			setIsExecuting(true)
			setIsPaused(false)

			// Create or reuse thread
			let currentThreadId = threadId
			if (!currentThreadId || !resume) {
				const newThread = await clientRef.current.threads.create()
				currentThreadId = newThread.thread_id
				setThreadId(currentThreadId)
				setSteps([])
				setCurrentStep("manager")
			}

			// Build configurable
			const configurable: any = {
				playground_session_id: sessionId,
				orchestrator_config: orchestratorConfig,
			}

			// Update instructions in config
			const configWithInstructions = {
				...orchestratorConfig,
				manager: {
					...orchestratorConfig.manager,
					user_prompt: instructions || orchestratorConfig.manager.user_prompt,
				},
			}
			configurable.orchestrator_config = configWithInstructions

			// Start or resume orchestrator execution
			const availableAgentsMap = buildAvailableAgents()
			const input = resume
				? undefined // Resume from current state
				: {
						available_agents: availableAgentsMap,
						max_iterations: orchestratorConfig.execution?.max_iterations || 10,
					}

			const stream = await clientRef.current.runs.stream(
				currentThreadId,
				"orchestratorAgent",
				{
					input,
					streamMode: "updates" as any,
					config: {
						configurable,
					},
				}
			)

			runStreamRef.current = stream

			// Process stream events
			let managerDecision: any = null
			let currentAgentExecuting: string | null = null

			for await (const event of stream) {
				if (event.event === "updates" && event.data) {
					const state = event.data

					// Check if manager made a decision
					if (state.next_agent && !currentAgentExecuting) {
						// Manager decided to delegate
						const agentName = state.next_agent
						const agent = availableAgents.find(
							(a) => a.name === agentName || a.assistant_id === agentName
						)

						// Extract manager's decision message
						const managerMessages = state.messages?.filter(
							(m: any) => m.type === "ai" && !m.name
						)
						const lastManagerMessage = managerMessages?.[managerMessages.length - 1]
						const managerContent =
							typeof lastManagerMessage?.content === "string"
								? lastManagerMessage.content
								: JSON.stringify(lastManagerMessage?.content || "")

						// Parse decision
						try {
							const jsonMatch = managerContent.match(/\{[\s\S]*\}/)
							if (jsonMatch) {
								managerDecision = JSON.parse(jsonMatch[0])
							}
						} catch {
							// Not JSON, use raw content
						}

						setSteps((prev) => [
							...prev,
							{
								type: "manager",
								content: managerDecision
									? `Delegating to ${agentName}: ${managerDecision.instruction || ""}`
									: managerContent,
								timestamp: new Date(),
							},
						])

						// Pause after manager decision
						setIsPaused(true)
						setIsExecuting(false)
						setCurrentStep("agent")
						setNextAgentId(agent?.assistant_id || agentName)
						return
					}

					// Check if agent is executing
					if (state.messages) {
						const agentMessages = state.messages.filter((m: any) => m.name && m.type === "ai")
						if (agentMessages.length > 0 && !currentAgentExecuting) {
							const lastAgentMessage = agentMessages[agentMessages.length - 1]
							const agentName = lastAgentMessage.name
							const agent = availableAgents.find((a) => a.name === agentName)

							currentAgentExecuting = agentName

							setSteps((prev) => [
								...prev,
								{
									type: "agent",
									agentId: agent?.assistant_id,
									agentName: agentName,
									content:
										typeof lastAgentMessage.content === "string"
											? lastAgentMessage.content
											: JSON.stringify(lastAgentMessage.content),
									timestamp: new Date(),
								},
							])

							// Pause after agent response
							setIsPaused(true)
							setIsExecuting(false)
							setCurrentStep("manager")
							setNextAgentId(null)
							return
						}
					}

					// Check if complete
					if (state.is_complete) {
						const finalMessages = state.messages?.filter(
							(m: any) => m.type === "ai" && !m.name
						)
						const finalMessage = finalMessages?.[finalMessages.length - 1]
						if (finalMessage) {
							setSteps((prev) => [
								...prev,
								{
									type: "manager",
									content:
										typeof finalMessage.content === "string"
											? finalMessage.content
											: JSON.stringify(finalMessage.content),
									timestamp: new Date(),
								},
							])
						}
						setIsPaused(false)
						setIsExecuting(false)
						setCurrentStep(null)
						return
					}
				}
			}
		} catch (error) {
			console.error("Error executing orchestrator:", error)
			setSteps((prev) => [
				...prev,
				{
					type: "manager",
					content: `Error: ${error instanceof Error ? error.message : String(error)}`,
					timestamp: new Date(),
				},
			])
		} finally {
			setIsExecuting(false)
		}
	}

	const handleResume = () => {
		executeOrchestrator(true)
	}

	const handleExecute = () => {
		executeOrchestrator(false)
	}

	const getAgentName = (agentId: string | undefined) => {
		if (!agentId) return "Unknown Agent"
		const agent = availableAgents.find((a) => a.assistant_id === agentId)
		return agent?.name || agentId
	}

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-border">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold">Orchestrator Execution</h3>
					{!isExecuting && !isPaused && steps.length === 0 && (
						<Button onClick={handleExecute} disabled={selectedTeam.length === 0 || !instructions.trim()}>
							<Play className="h-4 w-4 mr-2" />
							Execute
						</Button>
					)}
					{isPaused && (
						<Button onClick={handleResume}>
							<ArrowRight className="h-4 w-4 mr-2" />
							Next
						</Button>
					)}
				</div>
				{selectedTeam.length === 0 && (
					<div className="mt-2 text-xs text-muted-foreground bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
						Select at least one agent to execute
					</div>
				)}
				{!instructions.trim() && (
					<div className="mt-2 text-xs text-muted-foreground bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
						Enter instructions to execute
					</div>
				)}
			</div>

			{/* Steps */}
			<ScrollArea className="flex-1 p-4">
				<div className="space-y-4">
					{steps.length === 0 ? (
						<div className="text-center text-muted-foreground py-8">
							<p className="text-lg">Ready to execute</p>
							<p className="text-sm mt-2">
								Configure the orchestrator and click Execute to start
							</p>
						</div>
					) : (
						steps.map((step, idx) => (
							<div key={idx} className="space-y-2">
								<div className="flex items-center gap-2">
									<div
										className={`px-2 py-1 rounded text-xs font-medium ${
											step.type === "manager"
												? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
												: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
										}`}
									>
										{step.type === "manager" ? "Manager" : step.agentName || "Agent"}
									</div>
									<span className="text-xs text-muted-foreground">
										{step.timestamp.toLocaleTimeString()}
									</span>
								</div>
								<div
									className={`rounded-lg p-3 ${
										step.type === "manager"
											? "bg-blue-50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50"
											: "bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-800/50"
									}`}
								>
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<ReactMarkdown>{step.content}</ReactMarkdown>
									</div>
								</div>
							</div>
						))
					)}

					{isExecuting && (
						<div className="flex justify-start">
							<div className="bg-muted rounded-lg p-3">
								<Loader2 className="h-4 w-4 animate-spin" />
							</div>
						</div>
					)}

					{isPaused && currentStep && (
						<div className="text-center text-muted-foreground py-4 border-t border-border mt-4">
							<p className="text-sm">
								{currentStep === "manager"
									? "Waiting for manager decision..."
									: `Waiting for ${getAgentName(nextAgentId || undefined)} to respond...`}
							</p>
							<p className="text-xs mt-1">Click Next to continue</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	)
}

