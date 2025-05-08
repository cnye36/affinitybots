export interface Agent {
  id: string;
  graph_id: string;
  name: string;
  description: string;
  metadata: AgentMetadata;
  config: AgentConfiguration;
  agent_avatar: string;
  created_at: string;
  updated_at: string;
}

export interface AgentConfiguration {
  model: ModelType;
  temperature: number;
  tools: string[];
  memory: {
    enabled: boolean;
    max_entries: number;
    relevance_threshold: number;
  };
  prompt_template: string;
  knowledge_base: {
    isEnabled: boolean;
    config: {
      sources: unknown[];
    };
  };
  enabled_mcp_servers: string[];
}

export interface AgentMetadata {
  owner_id: string;
}

export type ModelType = "gpt-4.1" | "gpt-4.1-mini" | "gpt-4.1-nano" | "gpt-o3";
