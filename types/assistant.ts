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
  /**
   * Legacy/compat model identifier. Prefer `llm` for new configurations.
   * Example: "gpt-5", "claude-3-7-sonnet-20250219"
   */
  model: ModelType;
  /**
   * Universal LLM identifier (provider:model). This is the runtime source of truth.
   * Example: "openai:gpt-5", "anthropic:claude-3-7-sonnet-20250219"
   */
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
  /**
   * Optional array of specific tool names to enable.
   * If provided, only these tools will be loaded from enabled MCP servers.
   * If not provided, all tools from enabled servers are loaded.
   */
  selected_tools?: string[];
} 

export interface AssistantMetadata {
  owner_id: string;
  description?: string;
  agent_avatar?: string;
}

export type ModelType =
  /**
   * Kept as a string for forward-compatibility as supported model IDs evolve.
   * Use `lib/llm/catalog.ts` (`LLM_OPTIONS`) as the single source of truth for selectable models.
   */
  string;

export interface MCPServerSession {
  server_name: string;
  session_id: string;
  expires_at: string;
}