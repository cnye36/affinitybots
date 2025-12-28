import { create } from "zustand"
import {
	PlaygroundSession,
	PlaygroundStep,
	ContextEntry,
	WorkflowExportConfig,
	TemplateExportConfig,
	DraftExportConfig,
} from "@/types/playground"
import { OrchestratorConfig } from "@/types/workflow"

interface PlaygroundStore {
	// Session state
	currentSession: PlaygroundSession | null
	sessions: PlaygroundSession[]
	isLoadingSession: boolean

	// Current agent configuration
	currentAgentId: string | null
	selectedTools: string[]
	toolApprovalMode: "auto" | "manual"

	// Context management
	contextHistory: ContextEntry[]
	currentContext: string | null

	// Mode
	mode: "sequential" | "orchestrator"
	orchestratorConfig: OrchestratorConfig | null
	selectedTeam: string[] // Agent IDs for orchestrator team

	// UI state
	isExecuting: boolean
	currentStepId: string | null

	// Actions - Session management
	createSession: (name: string, mode: "sequential" | "orchestrator") => Promise<void>
	loadSession: (sessionId: string) => Promise<void>
	updateSession: (updates: Partial<PlaygroundSession>) => Promise<void>
	deleteSession: (sessionId: string) => Promise<void>
	listSessions: () => Promise<void>

	// Actions - Agent selection
	selectAgent: (agentId: string, agentName: string) => void
	toggleTool: (toolName: string) => void
	setSelectedTools: (tools: string[]) => void
	setToolApprovalMode: (mode: "auto" | "manual") => void

	// Actions - Step execution
	addStep: (stepData: StepData) => Promise<string>
	retryStep: (stepId: string) => Promise<void>

	// Actions - Context management
	handoffContext: (output: string, threadId?: string) => void
	clearContext: () => void

	// Actions - Mode management
	setMode: (mode: "sequential" | "orchestrator") => void
	setOrchestratorConfig: (config: OrchestratorConfig) => void
	setSelectedTeam: (agentIds: string[]) => void

	// Actions - Export
	exportToWorkflow: (config: WorkflowExportConfig) => Promise<string>
	exportToTemplate: (config: TemplateExportConfig) => Promise<string>
	exportToDraft: (config: DraftExportConfig) => Promise<string>

	// Reset
	reset: () => void
}

interface StepData {
	agentId: string
	agentName: string
	selectedTools: string[]
	userPrompt?: string
	previousContext?: string
	toolApprovalMode: "auto" | "manual"
}

export const usePlaygroundStore = create<PlaygroundStore>((set, get) => ({
	// Initial state
	currentSession: null,
	sessions: [],
	isLoadingSession: false,
	currentAgentId: null,
	selectedTools: [],
	toolApprovalMode: "auto",
	contextHistory: [],
	currentContext: null,
	mode: "sequential",
	orchestratorConfig: null,
	selectedTeam: [],
	isExecuting: false,
	currentStepId: null,

	// Session management
	createSession: async (name: string, mode: "sequential" | "orchestrator") => {
		try {
			const response = await fetch("/api/playground/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name, mode }),
			})

			if (!response.ok) throw new Error("Failed to create session")

			const session = await response.json()
			set({
				currentSession: session,
				mode: session.mode,
				orchestratorConfig: session.orchestrator_config || null,
				contextHistory: [],
				currentContext: null,
			})
		} catch (error) {
			console.error("Error creating session:", error)
			throw error
		}
	},

	loadSession: async (sessionId: string) => {
		try {
			set({ isLoadingSession: true })

			const response = await fetch(`/api/playground/sessions/${sessionId}`)
			if (!response.ok) throw new Error("Failed to load session")

			const session = await response.json()
			set({
				currentSession: session,
				mode: session.mode,
				orchestratorConfig: session.orchestrator_config || null,
				contextHistory: session.context_history || [],
				currentAgentId: session.current_agent_id || null,
				isLoadingSession: false,
			})

			// Load steps for this session
			const stepsResponse = await fetch(`/api/playground/sessions/${sessionId}/steps`)
			if (stepsResponse.ok) {
				const steps = await stepsResponse.json()
				// Update context history from completed steps
				const history: ContextEntry[] = steps
					.filter((step: PlaygroundStep) => step.status === "completed" && step.output)
					.map((step: PlaygroundStep) => ({
						stepNumber: step.step_number,
						agentId: step.agent_id,
						agentName: step.agent_name,
						output: typeof step.output === "string" ? step.output : JSON.stringify(step.output),
						timestamp: step.completed_at || step.created_at,
						threadId: step.thread_id,
					}))
				set({ contextHistory: history })
			}
		} catch (error) {
			console.error("Error loading session:", error)
			set({ isLoadingSession: false })
			throw error
		}
	},

	updateSession: async (updates: Partial<PlaygroundSession>) => {
		const { currentSession } = get()
		if (!currentSession) return

		try {
			const response = await fetch(`/api/playground/sessions/${currentSession.session_id}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(updates),
			})

			if (!response.ok) throw new Error("Failed to update session")

			const updatedSession = await response.json()
			set({ currentSession: updatedSession })
		} catch (error) {
			console.error("Error updating session:", error)
			throw error
		}
	},

	deleteSession: async (sessionId: string) => {
		try {
			const response = await fetch(`/api/playground/sessions/${sessionId}`, {
				method: "DELETE",
			})

			if (!response.ok) throw new Error("Failed to delete session")

			// Remove from sessions list
			set(state => ({
				sessions: state.sessions.filter(s => s.session_id !== sessionId),
				// Clear current session if it was deleted
				currentSession: state.currentSession?.session_id === sessionId ? null : state.currentSession,
			}))
		} catch (error) {
			console.error("Error deleting session:", error)
			throw error
		}
	},

	listSessions: async () => {
		try {
			const response = await fetch("/api/playground/sessions")
			if (!response.ok) throw new Error("Failed to list sessions")

			const sessions = await response.json()
			set({ sessions })
		} catch (error) {
			console.error("Error listing sessions:", error)
			throw error
		}
	},

	// Agent selection
	selectAgent: (agentId: string, agentName: string) => {
		set({
			currentAgentId: agentId,
			selectedTools: [], // Reset tools when switching agents
		})

		// Update session
		const { currentSession, updateSession } = get()
		if (currentSession) {
			updateSession({ current_agent_id: agentId })
		}
	},

	toggleTool: (toolName: string) => {
		set(state => {
			const tools = state.selectedTools.includes(toolName)
				? state.selectedTools.filter(t => t !== toolName)
				: [...state.selectedTools, toolName]
			return { selectedTools: tools }
		})
	},

	setSelectedTools: (tools: string[]) => {
		set({ selectedTools: tools })
	},

	setToolApprovalMode: (mode: "auto" | "manual") => {
		set({ toolApprovalMode: mode })
	},

	// Step execution
	addStep: async (stepData: StepData) => {
		const { currentSession, contextHistory } = get()
		if (!currentSession) throw new Error("No active session")

		try {
			set({ isExecuting: true })

			const response = await fetch(`/api/playground/sessions/${currentSession.session_id}/steps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...stepData,
					step_number: contextHistory.length + 1,
				}),
			})

			if (!response.ok) throw new Error("Failed to execute step")

			const step: PlaygroundStep = await response.json()
			set({ currentStepId: step.step_id, isExecuting: false })

			return step.step_id
		} catch (error) {
			console.error("Error executing step:", error)
			set({ isExecuting: false })
			throw error
		}
	},

	retryStep: async (stepId: string) => {
		const { currentSession } = get()
		if (!currentSession) throw new Error("No active session")

		try {
			set({ isExecuting: true })

			const response = await fetch(
				`/api/playground/sessions/${currentSession.session_id}/steps/${stepId}/retry`,
				{ method: "POST" }
			)

			if (!response.ok) throw new Error("Failed to retry step")

			set({ isExecuting: false })
		} catch (error) {
			console.error("Error retrying step:", error)
			set({ isExecuting: false })
			throw error
		}
	},

	// Context management
	handoffContext: (output: string, threadId?: string) => {
		const { currentAgentId, contextHistory } = get()
		if (!currentAgentId) return

		const entry: ContextEntry = {
			stepNumber: contextHistory.length + 1,
			agentId: currentAgentId,
			agentName: "", // Will be set by caller
			output,
			timestamp: new Date().toISOString(),
			threadId,
		}

		set({
			contextHistory: [...contextHistory, entry],
			currentContext: output,
		})
	},

	clearContext: () => {
		set({ currentContext: null })
	},

	// Mode management
	setMode: (mode: "sequential" | "orchestrator") => {
		set({ mode })

		// Update session
		const { currentSession, updateSession } = get()
		if (currentSession) {
			updateSession({ mode })
		}
	},

	setOrchestratorConfig: (config: OrchestratorConfig) => {
		set({ orchestratorConfig: config })

		// Update session
		const { currentSession, updateSession } = get()
		if (currentSession) {
			updateSession({ orchestrator_config: config })
		}
	},

	setSelectedTeam: (agentIds: string[]) => {
		set({ selectedTeam: agentIds })
	},

	// Export
	exportToWorkflow: async (config: WorkflowExportConfig) => {
		const { currentSession } = get()
		if (!currentSession) throw new Error("No active session")

		try {
			const response = await fetch(
				`/api/playground/sessions/${currentSession.session_id}/export/workflow`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(config),
				}
			)

			if (!response.ok) throw new Error("Failed to export workflow")

			const { workflow_id } = await response.json()
			return workflow_id
		} catch (error) {
			console.error("Error exporting to workflow:", error)
			throw error
		}
	},

	exportToTemplate: async (config: TemplateExportConfig) => {
		const { currentSession } = get()
		if (!currentSession) throw new Error("No active session")

		try {
			const response = await fetch(
				`/api/playground/sessions/${currentSession.session_id}/export/template`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(config),
				}
			)

			if (!response.ok) throw new Error("Failed to export template")

			const { template_id } = await response.json()
			return template_id
		} catch (error) {
			console.error("Error exporting to template:", error)
			throw error
		}
	},

	exportToDraft: async (config: DraftExportConfig) => {
		const { currentSession } = get()
		if (!currentSession) throw new Error("No active session")

		try {
			const response = await fetch(
				`/api/playground/sessions/${currentSession.session_id}/export/draft`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(config),
				}
			)

			if (!response.ok) throw new Error("Failed to export draft")

			const { draft_id } = await response.json()
			return draft_id
		} catch (error) {
			console.error("Error exporting to draft:", error)
			throw error
		}
	},

	// Reset
	reset: () => {
		set({
			currentSession: null,
			currentAgentId: null,
			selectedTools: [],
			toolApprovalMode: "auto",
			contextHistory: [],
			currentContext: null,
			mode: "sequential",
			orchestratorConfig: null,
			selectedTeam: [],
			isExecuting: false,
			currentStepId: null,
		})
	},
}))
