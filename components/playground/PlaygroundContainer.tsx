"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { AgentSelector } from "./AgentSelector"
import { ConfigurationPanel } from "./ConfigurationPanel"
import { PlaygroundChat } from "./PlaygroundChat"
import { PlaygroundAgentConfig } from "./PlaygroundAgentConfig"
import { OrchestratorSidebar } from "./OrchestratorSidebar"
import { OrchestratorChat } from "./OrchestratorChat"
import { PlaygroundEmptyState } from "./PlaygroundEmptyState"
import { SessionHistoryDropdown } from "./SessionHistoryDropdown"
import { Assistant } from "@/types/assistant"
import { Tool, ServerInfo } from "@/types/playground"
import { Button } from "@/components/ui/button"
import { Plus, History, Sparkles, ArrowRightLeft, Users } from "lucide-react"
import { useSectionTheme } from "@/hooks/useSectionTheme"

interface PlaygroundContainerProps {
	sessionId?: string
	assistants: Assistant[]
}

export function PlaygroundContainer({ sessionId, assistants }: PlaygroundContainerProps) {
	const theme = useSectionTheme()
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
	const [creatingSession, setCreatingSession] = useState(false)

	// Load session on mount if sessionId provided
	useEffect(() => {
		if (sessionId) {
			loadSession(sessionId)
		}
		// Don't auto-create session - let user click "New Session" button
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

	const handleNewSession = async () => {
		setCreatingSession(true)
		try {
			await createSession("New Playground Session", mode)
		} catch (error) {
			console.error("Error creating session:", error)
		} finally {
			setCreatingSession(false)
		}
	}

	return (
		<div className="flex h-screen bg-background">
			{/* Left Panel - Configuration */}
			<div className="w-[480px] min-w-[480px] max-w-[480px] border-r border-border flex flex-col bg-card overflow-hidden">
				<div className={`p-4 border-b ${theme.borderColor}`}>
					<div className="flex items-center justify-between">
						<div>
							<h2 className={`text-xl font-bold ${theme.headerGradient} bg-clip-text text-transparent`}>
								Playground
							</h2>
							{currentSession && (
								<p className="text-sm text-muted-foreground mt-1">{currentSession.name}</p>
							)}
						</div>
						<div className="flex items-center gap-2">
							<SessionHistoryDropdown>
								<Button
									variant="ghost"
									size="icon"
									className={`h-8 w-8 ${theme.sidebarText}`}
									title="Session History"
								>
									<History className="h-4 w-4" />
								</Button>
							</SessionHistoryDropdown>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => {
									if (currentSession) {
										// If session exists, clear context for new chat
										clearContext()
									} else {
										// If no session, create new one
										handleNewSession()
									}
								}}
								className={`h-8 w-8 ${theme.sidebarText}`}
								title={currentSession ? "New Chat" : "New Session"}
							>
								<Plus className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>

				<div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 w-full">
					{currentSession ? (
						<>
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
												key={currentAgentId} // Force re-render when agent changes
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
						</>
					) : (
						<div className="flex items-center justify-center py-12 px-4 text-center text-muted-foreground">
							<div>
								<Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p className="text-sm font-medium">No active session</p>
								<p className="text-xs mt-1">Click "New Session" or the "+" button to start</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Right Panel - Chat */}
			<div className="flex-1 flex flex-col">
				{!currentSession ? (
					<PlaygroundEmptyState mode={mode} onNewSession={handleNewSession} isCreating={creatingSession} />
				) : mode === "orchestrator" && orchestratorConfig ? (
					<OrchestratorChat
						sessionId={currentSession.session_id}
						orchestratorConfig={orchestratorConfig}
						selectedTeam={selectedTeam}
						instructions={orchestratorInstructions}
						availableAgents={assistants}
					/>
				) : mode === "sequential" && currentAgentId ? (
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
					<div className="flex-1 flex items-center justify-center p-8">
						<motion.div
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.3 }}
							className="text-center max-w-md"
						>
							<div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 mb-6">
								{mode === "orchestrator" ? (
									<Users className="h-16 w-16 mx-auto text-indigo-600 dark:text-indigo-400 mb-4" />
								) : (
									<ArrowRightLeft className="h-16 w-16 mx-auto text-blue-600 dark:text-blue-400 mb-4" />
								)}
							</div>
							<h3 className="text-xl font-semibold mb-2">
								{mode === "orchestrator" ? "Configure Your Team" : "Select an Agent"}
							</h3>
							<p className="text-sm text-muted-foreground">
								{mode === "orchestrator"
									? "Set up the orchestrator configuration and select team members from the left panel"
									: "Choose an agent from the left panel to start testing"}
							</p>
						</motion.div>
					</div>
				)}
			</div>
		</div>
	)
}
