import { Tool } from "@langchain/core/tools";

// Available model types
export type ModelType = "gpt-4o" | "gpt-4o-mini" | "gpt-o1" | "gpt-o1-mini";

// Tool related types
export type ToolID = "web_search" | "wikipedia" | "wolfram_alpha";

export interface ToolConfig {
  isEnabled: boolean;
  config: Record<string, unknown>;
  knowledge_base?: {
    isEnabled: boolean;
    config: KnowledgeBaseConfig;
  };
}

export interface ToolsConfig {
  [key: string]: ToolConfig;
}

export interface ToolCall {
  tool_call_id: string;
  tool_id: string;
  arguments: string;
}

// Memory configuration
export interface MemoryConfig {
  enabled: boolean;
  max_entries: number;
  relevance_threshold: number;
}

export interface AgentState {
  messages: Message[];
  tools: Tool[];
  memory: MemoryConfig;
}

// Main configurable options
export interface AgentConfigurableOptions {
  model: ModelType;
  temperature: number;
  tools: ToolsConfig;
  memory: MemoryConfig;
  prompt_template: string;
  avatar: string;
  owner_id: string;
}

// Metadata for the agent
export interface AgentMetadata {
  description: string;
  agent_type: string;
  owner_id: string;
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

export interface ThreadConfig {
  tags?: string[];
  recursion_limit?: number;
  configurable?: Record<string, unknown>;
  webhook?: string;
  interrupt_before?: string;
  interrupt_after?: string;
  stream_mode?: "values" | "messages";
  stream_subgraphs?: boolean;
  on_disconnect?: "cancel" | "continue";
  feedback_keys?: string[];
}

// For run creation/streaming, based on the API schema shown
export interface RunStreamParams {
  input: {
    messages: { role: "user" | "assistant"; content: string }[];
  };
  config?: {
    tags?: string[];
    recursion_limit?: number;
    configurable?: Record<string, unknown>;
  };
  streamMode?: ["values" | "messages"];
  onDisconnect?: "cancel" | "continue";
  webhook?: string;
  interrupt_before?: string;
  interrupt_after?: string;
  stream_subgraphs?: boolean;
  feedback_keys?: string[];
  multitask_strategy?: "reject" | "rollback" | "interrupt" | "enqueue";
  if_not_exists?: "create" | "reject";
  after_seconds?: number;
}

// Update the Thread interface to match what the API returns
export interface Thread {
  thread_id: string;
  metadata?: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  config?: {
    tags?: string[];
    recursion_limit?: number;
    configurable?: Record<string, unknown>;
  };
}

// Update Message type to match what the API expects
export interface Message {
  role: "user" | "assistant";
  content: string;
  tool_calls?: ToolCall[];
  created_at?: string;
}

export interface Assistant {
  assistant_id: string;
  name: string;
  graph_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  version: number;
  config: {
    configurable: {
      model?: "gpt-4o-mini" | "gpt-4o" | "gpt-o1" | "gpt-o1-mini";
      temperature?: number;
      instructions?: string;
      prompt_template?: string;
      tools?: Partial<
        Record<"web_search" | "wikipedia" | "wolfram_alpha", ToolConfig>
      >;
      memory?: {
        enabled: boolean;
        max_entries: number;
        relevance_threshold: number;
      };
      avatar?: string;
      owner_id: string;
    };
  };
}

export interface Stream {
  assistant_id: string;
  checkpoint: Checkpoint;
  input: Record<string, unknown>;
  command: Record<string, unknown>;
  metadata: Record<string, unknown>;
  config: Config;
  webhook: string;
  interrupt_before: Record<string, unknown>;
  interrupt_after: Record<string, unknown>;
  stream_mode: "values" | "messages" | "updates";
  stream_subgraphs: boolean;
  on_disconnect: "cancel" | "continue";
  feedback_keys: string[];
  multitask_strategy: "reject" | "rollback" | "interrupt" | "enqueue";
  if_not_exists: "create" | "reject";
  after_seconds: number;
}

export interface Checkpoint {
  thread_id: string;
  checkpoint_ns: string;
  checkpoint_id: string;
  checkpoint_map: Record<string, unknown>;
}

export interface Config {
  tags: string[];
  recursion_limit: number;
  configurable: Record<string, unknown>;
}

export type WorkflowStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "failed";
export type TaskStatus = "pending" | "running" | "completed" | "failed";

export interface WorkflowTask {
  task_id: string;
  workflow_id: string;
  assistant_id: string;
  name: string;
  description?: string;
  task_type: string;
  config: Record<string, unknown>;
  position: number;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  metadata: Record<string, unknown>;
}

export interface Workflow {
  workflow_id: string;
  name: string;
  description?: string;
  owner_id: string;
  nodes: Array<{
    data: {
      assistant_id: string;
      label: string;
    };
  }>;
  edges: unknown[];
  config: Record<string, unknown>;
  status: WorkflowStatus;
  created_at: string;
  updated_at: string;
  last_run_at?: string;
  is_active: boolean;
}

export interface WorkflowRun {
  run_id: string;
  workflow_id: string;
  thread_id?: string;
  status: TaskStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  result?: unknown;
  metadata: Record<string, unknown>;
}

export interface WorkflowTaskRun {
  task_run_id: string;
  workflow_run_id: string;
  task_id: string;
  run_id?: string;
  status: TaskStatus;
  started_at: string;
  completed_at?: string;
  error?: string;
  result?: unknown;
  metadata: Record<string, unknown>;
}

export type TaskType =
  | "process_input"
  | "generate_content"
  | "analyze_data"
  | "make_decision"
  | "transform_data"
  | "api_call"
  | "custom";

export interface Task {
  task_id?: string;
  name: string;
  description: string;
  type: TaskType;
  agentId: string;
  workflowId: string;
  config?: {
    input: {
      source: string;
    };
    output: {
      destination: string;
    };
  };
}

interface KnowledgeBaseConfig {
  sources: string[];
  files?: File[];
}
