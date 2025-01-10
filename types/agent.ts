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
  tone?: string;
  language?: string;
  toolsConfig?: Record<string, unknown>;
  knowledgeBase?: KnowledgeBase;
}

export interface AgentConfig {
  id: string;
  name: string;
  description?: string;
  model_type: string;
  prompt_template: string;
  tools: string[];
  avatar?: string;
  config: {
    temperature?: number;
    enableKnowledge?: boolean;
    tone?: string;
    language?: string;
    toolsConfig?: Record<string, unknown>;
  };
}
