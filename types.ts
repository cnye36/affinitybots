export interface AgentConfig {
  id: string
  owner_id: string
  name: string
  description?: string
  prompt_template: string
  model_type: string
  config?: {
    temperature?: number
    max_tokens?: number
    use_memory?: boolean
    tools?: string[]
  }
  created_at?: string
  updated_at?: string
} 