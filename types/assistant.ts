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
  force_mcp_refresh: boolean;
  mcp_oauth_sessions: {
    server_name: string;
    session_id: string;
    expires_at: string;
  }[];
} 

export interface AssistantMetadata {
  owner_id: string;
  description?: string;
  agent_avatar?: string;
}

export type ModelType = "gpt-5-2025-08-07" | "gpt-5-mini-2025-08-07" | "gpt-5-nano-2025-08-07" | "gpt-4o";

export interface MCPServerSession {
  server_name: string;
  session_id: string;
  expires_at: string;
}