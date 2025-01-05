export interface DocumentEntry {
  id: string;
  filename: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  documents: DocumentEntry[];
}

export interface AgentBaseConfig {
  temperature?: number;
  max_tokens?: number;
  use_memory?: boolean;
  enableKnowledge?: boolean;
  tone?: string;
  language?: string;
  toolsConfig?: Record<string, any>;
  knowledgeBase?: KnowledgeBase;
}

export interface AgentConfig {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  model_type: string;
  prompt_template: string;
  tools: string[];
  config: AgentBaseConfig;
  created_at?: string;
  updated_at?: string;
}
