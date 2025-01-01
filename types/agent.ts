export interface DocumentEntry {
  id: string
  type: 'document'
  name: string
  url?: string // If the document is accessible via a URL
  filePath?: string // Path to the uploaded file
  uploadedAt: string
  agent_id: string
}

export interface UrlEntry {
  id: string
  type: 'url'
  url: string
  indexedAt: string
  agent_id: string
}

export interface KnowledgeBase {
  documents: DocumentEntry[]
  urls: UrlEntry[]
}

export interface AgentBaseConfig {
  temperature?: number
  max_tokens?: number
  use_memory?: boolean
  enableKnowledge?: boolean
  tone?: string
  language?: string
  toolsConfig?: Record<string, any>
  knowledgeBase?: KnowledgeBase
}

export interface AgentConfig {
  id: string
  owner_id: string
  name: string
  description: string
  model_type: string
  prompt_template: string
  tools: string[]
  config: AgentBaseConfig
  created_at?: string
  updated_at?: string
}
