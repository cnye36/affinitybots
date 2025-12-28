import { OrchestratorConfig } from "./workflow"

export interface PlaygroundSession {
	session_id: string
	user_id: string
	name: string
	description?: string
	mode: "sequential" | "orchestrator"
	orchestrator_config?: OrchestratorConfig
	current_agent_id?: string
	steps: string[] // Array of step IDs (stored as JSONB in DB)
	context_history: ContextEntry[]
	created_at: string
	updated_at: string
	last_activity_at: string
}

export interface PlaygroundStep {
	step_id: string
	session_id: string
	user_id: string
	step_number: number
	agent_id: string
	agent_name: string
	selected_tools: string[] // Array of tool names
	tool_approval_mode: "auto" | "manual"
	user_prompt?: string
	previous_context?: string
	thread_id?: string
	output?: any
	started_at?: string
	completed_at?: string
	status: "pending" | "running" | "completed" | "failed"
	error?: string
	created_at: string
}

export interface ContextEntry {
	stepNumber: number
	agentId: string
	agentName: string
	output: string
	timestamp: Date | string
	threadId?: string
}

export interface PlaygroundTemplate {
	template_id: string
	user_id: string
	name: string
	description?: string
	category?: string
	template_config: TemplateConfig
	is_public: boolean
	is_official: boolean
	created_at: string
	updated_at: string
}

export interface TemplateConfig {
	mode: "sequential" | "orchestrator"
	orchestrator_config?: OrchestratorConfig
	steps: TemplateStep[]
}

export interface TemplateStep {
	agent_role: string // Generic role instead of specific agent_id
	agent_description: string
	selected_tools: string[]
	prompt_template?: string
	tool_approval_mode: "auto" | "manual"
}

export interface PlaygroundDraft {
	draft_id: string
	user_id: string
	session_id?: string
	name: string
	draft_data: PlaygroundExport
	created_at: string
	updated_at: string
}

export interface PlaygroundExport {
	version: string
	export_date: string
	session: {
		name: string
		description?: string
		mode: "sequential" | "orchestrator"
		orchestrator_config?: OrchestratorConfig
	}
	steps: Array<{
		step_number: number
		agent: {
			id: string
			name: string
		}
		selected_tools: string[]
		user_prompt?: string
		output: any
		metadata: {
			started_at?: string
			completed_at?: string
			status: string
		}
	}>
	import_instructions: {
		required_agents: string[]
		required_tools: string[]
	}
}

export interface Tool {
	name: string
	displayName: string
	description: string
	serverName: string
	schema: Record<string, unknown>
	category?: string
}

export interface ServerInfo {
	name: string
	displayName: string
	toolCount: number
	isOAuth: boolean
	isConnected: boolean
}

export interface WorkflowExportConfig {
	workflowName: string
	workflowDescription?: string
	triggerType?: "manual" | "webhook" | "form" | "integration" | "schedule"
	triggerConfig?: Record<string, unknown>
}

export interface TemplateExportConfig {
	name: string
	description?: string
	category?: string
	is_public: boolean
}

export interface DraftExportConfig {
	name: string
	downloadJson?: boolean
}
