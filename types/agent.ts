import { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  metadata: {
    assistantId: string;
    threadId?: string;
    userId?: string;
  };
}

export interface AgentConfig {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  model: string;
  prompt_template: string;
  tools: string[];
  avatar?: string;
  config: {
    temperature?: number;
    memory?: {
      enabled: boolean;
      max_entries?: number;
      relevance_threshold?: number;
    };
  };
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeBase {
  documents: DocumentEntry[];
}

export interface DocumentEntry {
  id: string;
  filename: string;
  type: string;
  size: number;
  created_at: string;
  updated_at: string;
}
