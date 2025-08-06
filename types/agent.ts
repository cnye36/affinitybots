export interface Agent {
  assistant_id: string;
  graph_id: string;
  name: string;
  description: string;
  metadata: AgentMetadata;
  config: AgentConfiguration;
  agent_avatar: string;
  created_at: string;
  updated_at: string;
}

export interface MCPServerSession {
  server_name: string;
  session_id: string;
  expires_at?: string;
  auth_type: 'oauth' | 'api_key';
}

export interface AgentConfiguration {
  model: ModelType;
  temperature: number;
  tools: string[];
  memory: {
    enabled: boolean;
    max_entries?: number;
    relevance_threshold?: number;
  };
  prompt_template: string;
  knowledge_base: {
    isEnabled: boolean;
    config: {
      sources: unknown[];
    };
  };
  // Array of qualified names from Smithery registry (e.g., "@tavily/tavily", "@supabase/supabase-mcp")
  enabled_mcp_servers: string[];
  // OAuth sessions for MCP servers that require OAuth authentication
  mcp_oauth_sessions?: MCPServerSession[];
  // Force refresh MCP clients (useful for testing or token refresh)
  force_mcp_refresh?: boolean;
  agentId?: string;
}

export interface AgentMetadata {
  owner_id: string;
}

export type ModelType = "gpt-4.1" | "gpt-4.1-mini" | "gpt-4.1-nano" | "gpt-o3";
