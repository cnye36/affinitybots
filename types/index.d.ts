export interface AgentConfig {
  id: string
  name: string
  description: string
  model_type: string
  prompt_template: string
  tools: string[]
  config: {
    temperature?: number
    enableKnowledge?: boolean
    tone?: string
    language?: string
    toolsConfig?: Record<string, any>
  }
} 