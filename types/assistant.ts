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
  // Optional universal LLM identifier, e.g. "openai:gpt-4o-mini", "anthropic:claude-3-7-sonnet-latest"
  llm?: string;
  // Optional common generation params
  temperature?: number;
  reasoningEffort?: "low" | "medium" | "high";
  model_config?: any;
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

export type ModelType =
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gpt-4o-nano"
  | "claude-sonnet-4-20250514"
  | "claude-opus-4-20250514"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-haiku-20241022"
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.5-flash-lite";

export interface MCPServerSession {
  server_name: string;
  session_id: string;
  expires_at: string;
}