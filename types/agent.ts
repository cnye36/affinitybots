import { Tool } from "@langchain/core/tools";
import { ToolsConfig } from "./tools";
import { KnowledgeBaseConfig } from "./knowledge";

// Available model types
export type ModelType = "gpt-4o" | "gpt-4o-mini" | "gpt-o1" | "gpt-o1-mini";

// Memory configuration
export interface MemoryConfig {
  enabled: boolean;
  max_entries: number;
  relevance_threshold: number;
}

// Main configurable options
export interface AgentConfigurableOptions {
  model: ModelType;
  temperature: number;
  tools: ToolsConfig;
  memory: MemoryConfig;
  prompt_template: string;
  knowledge_base: KnowledgeBaseConfig;
  avatar: string;
  owner_id: string;
}

// Metadata for the agent
export interface AgentMetadata {
  description: string;
  agent_type: string;
  owner_id: string;
  [key: string]: string | unknown;
}

// Main agent configuration interface
export interface AgentConfig {
  name: string;
  configurable: AgentConfigurableOptions;
  metadata: AgentMetadata;
  tools: Tool[];
}

// For the modal props
export interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  initialConfig: AgentConfig;
  onSave?: (config: AgentConfig) => void;
}
