"use client"

import { useEffect, useState } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { AgentSelector } from "./AgentSelector"
import { ConfigurationPanel } from "./ConfigurationPanel"
import { PlaygroundChat } from "./PlaygroundChat"
import { PlaygroundAgentConfig } from "./PlaygroundAgentConfig"
import { OrchestratorSidebar } from "./OrchestratorSidebar"
import { OrchestratorChat } from "./OrchestratorChat"
import { Assistant } from "@/types/assistant"
import { Tool, ServerInfo } from "@/types/playground"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface PlaygroundContainerProps {
	sessionId?: string
	assistants: Assistant[]
}

export function PlaygroundContainer({ sessionId, assistants }: PlaygroundContainerProps) {
	const {
		currentSession,
		currentAgentId,
		selectedTools,
		currentContext,
		mode,
		orchestratorConfig,
		selectedTeam,
		loadSession,
		createSession,
		selectAgent,
		setMode,
		setOrchestratorConfig,
		setSelectedTeam,
		clearContext,
	} = usePlaygroundStore()

	const [availableTools, setAvailableTools] = useState<Tool[]>([])
	const [servers, setServers] = useState<ServerInfo[]>([])
	const [isLoadingTools, setIsLoadingTools] = useState(false)
	const [orchestratorInstructions, setOrchestratorInstructions] = useState("")

	// Load session on mount if sessionId provided
	useEffect(() => {
		if (sessionId) {
			loadSession(sessionId)
		} else {
			// Create new session
			createSession("New Playground Session", "sequential")
		}
	}, [sessionId])

	// Load tools when agent is selected
	useEffect(() => {
		if (!currentAgentId) return

		const fetchTools = async () => {
			setIsLoadingTools(true)
			try {
				const response = await fetch(`/api/playground/agents/${currentAgentId}/tools`)
				if (response.ok) {
					const data = await response.json()
					setAvailableTools(data.tools || [])
					setServers(data.servers || [])
				}
			} catch (error) {
				console.error("Error fetching tools:", error)
			} finally {
				setIsLoadingTools(false)
			}
		}

		fetchTools()
	}, [currentAgentId])

	const currentAgent = assistants.find(a => a.assistant_id === currentAgentId)

	return (
		<div className="flex h-screen bg-background">
			{/* Left Panel - Configuration */}
			<div className="w-98 border-r border-border flex flex-col bg-card">
				<div className="p-4 border-b border-border">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold">Playground</h2>
							{currentSession && (
								<p className="text-sm text-muted-foreground mt-1">{currentSession.name}</p>
							)}
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={() => {
								// Clear context for new chat
								clearContext()
								// Trigger a re-render by changing a key or using a state update
								// The chat component will handle clearing messages via useEffect
							}}
							className="h-8 w-8"
							title="New Chat"
						>
							<Plus className="h-4 w-4" />
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto p-4 space-y-4">
					{/* Configuration Panel (Mode Toggle) */}
					<ConfigurationPanel
						mode={mode}
						onModeToggle={setMode}
						orchestratorConfig={orchestratorConfig}
						onOrchestratorConfigChange={setOrchestratorConfig}
						availableAgents={assistants}
						selectedTeam={selectedTeam}
						onTeamChange={setSelectedTeam}
					/>

					{/* Orchestrator Sidebar (only show in orchestrator mode) */}
					{mode === "orchestrator" && (
						<OrchestratorSidebar
							orchestratorConfig={orchestratorConfig}
							onOrchestratorConfigChange={setOrchestratorConfig}
							availableAgents={assistants}
							selectedTeam={selectedTeam}
							onTeamChange={setSelectedTeam}
							instructions={orchestratorInstructions}
							onInstructionsChange={setOrchestratorInstructions}
						/>
					)}

					{/* Agent Selector (only show in sequential mode) */}
					{mode === "sequential" && (
						<>
							<AgentSelector
								agents={assistants}
								currentAgentId={currentAgentId}
								onSelectAgent={(agentId) => {
									const agent = assistants.find(a => a.assistant_id === agentId)
									if (agent) {
										selectAgent(agentId, agent.name)
									}
								}}
							/>

							{/* Agent Configuration Panel - Shows when agent is selected */}
							{currentAgentId && currentAgent && (
								<div className="border-t border-border pt-4 mt-4">
									<PlaygroundAgentConfig
										assistant={currentAgent}
										onConfigChange={() => {
											// Refresh tools when config changes
											if (currentAgentId) {
												const fetchTools = async () => {
													setIsLoadingTools(true)
													try {
														const response = await fetch(`/api/playground/agents/${currentAgentId}/tools`)
														if (response.ok) {
															const data = await response.json()
															setAvailableTools(data.tools || [])
															setServers(data.servers || [])
														}
													} catch (error) {
														console.error("Error fetching tools:", error)
													} finally {
														setIsLoadingTools(false)
													}
												}
												fetchTools()
											}
										}}
									/>
								</div>
							)}
						</>
					)}
				</div>
			</div>

			{/* Right Panel - Chat */}
			<div className="flex-1 flex flex-col">
				{mode === "orchestrator" && orchestratorConfig && currentSession ? (
					<OrchestratorChat
						sessionId={currentSession.session_id}
						orchestratorConfig={orchestratorConfig}
						selectedTeam={selectedTeam}
						instructions={orchestratorInstructions}
						availableAgents={assistants}
					/>
				) : currentSession && currentAgentId ? (
					<PlaygroundChat
						sessionId={currentSession.session_id}
						agentId={currentAgentId}
						selectedTools={selectedTools}
						previousContext={currentContext || undefined}
						mode={mode}
						orchestratorConfig={orchestratorConfig || undefined}
						selectedTeam={selectedTeam}
					/>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<p className="text-lg">
								{mode === "orchestrator"
									? "Configure orchestrator to get started"
									: "Select an agent to get started"}
							</p>
							<p className="text-sm mt-2">
								{mode === "orchestrator"
									? "Set up the orchestrator configuration and select team members"
									: "Choose an agent from the left panel to begin testing"}
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
