export interface Assistant {
  assistant_id: string;
  graph_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: AssistantMetadata;
  config: {
    configurable: AssistantConfiguration;
  };
  version: number;
}

export interface AssistantConfiguration {
  assistant_id: string;
  model: ModelType;
  temperature: number;
  tools: any[];
  memory: {
    enabled: boolean;
  };
  prompt_template: string;
  knowledge_base: {
    isEnabled: boolean;
    config: { sources: any[] };
  };
  enabled_mcp_servers: string[];
} 

export interface AssistantMetadata {
  owner_id: string;
  description?: string;
  agent_avatar?: string;
}

export type ModelType = "gpt-4.1" | "gpt-5" 