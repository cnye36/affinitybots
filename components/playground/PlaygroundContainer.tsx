"use client"

import { useEffect, useState } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { AgentSelector } from "./AgentSelector"
import { ToolSelector } from "./ToolSelector"
import { ContextPreview } from "./ContextPreview"
import { ConfigurationPanel } from "./ConfigurationPanel"
import { PlaygroundChat } from "./PlaygroundChat"
import { Assistant } from "@/types/assistant"
import { Tool, ServerInfo } from "@/types/playground"

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
	} = usePlaygroundStore()

	const [availableTools, setAvailableTools] = useState<Tool[]>([])
	const [servers, setServers] = useState<ServerInfo[]>([])
	const [isLoadingTools, setIsLoadingTools] = useState(false)

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
			<div className="w-96 border-r border-border flex flex-col bg-card">
				<div className="p-4 border-b border-border">
					<h2 className="text-lg font-semibold">Playground</h2>
					{currentSession && (
						<p className="text-sm text-muted-foreground mt-1">{currentSession.name}</p>
					)}
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

							{/* Tool Selector */}
							{currentAgentId && (
								<ToolSelector
									tools={availableTools}
									servers={servers}
									selectedTools={selectedTools}
									isLoading={isLoadingTools}
								/>
							)}

							{/* Context Preview */}
							{currentContext && (
								<ContextPreview
									previousOutput={currentContext}
									agentName={currentAgent?.name}
								/>
							)}
						</>
					)}
				</div>
			</div>

			{/* Right Panel - Chat */}
			<div className="flex-1 flex flex-col">
				{currentSession && (mode === "orchestrator" || currentAgentId) ? (
					<PlaygroundChat
						sessionId={currentSession.session_id}
						agentId={currentAgentId || ""}
						selectedTools={selectedTools}
						previousContext={currentContext || undefined}
						mode={mode}
						orchestratorConfig={orchestratorConfig || undefined}
						selectedTeam={selectedTeam}
					/>
				) : (
					<div className="flex-1 flex items-center justify-center text-muted-foreground">
						<div className="text-center">
							<p className="text-lg">Select an agent to get started</p>
							<p className="text-sm mt-2">Choose an agent from the left panel to begin testing</p>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
