export interface Assistant {
  assistant_id: string;
  graph_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: {
    owner_id: string;
    description?: string;
    agent_avatar?: string;
  };
  config: {
    configurable: {
      agentId: string;
      model?: string;
      temperature?: number;
      tools?: any[];
      memory?: {
        enabled: boolean;
      };
      prompt_template?: string;
      knowledge_base?: {
        isEnabled: boolean;
        config: { sources: any[] };
      };
      enabled_mcp_servers?: string[];
    };
  };
  version: number;
}

export interface AssistantConfiguration {
  name: string;
  description: string;
  agent_avatar?: string;
  model: string;
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