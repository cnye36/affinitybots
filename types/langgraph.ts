// import { AgentConfigurableOptions } from "@/lib/langchain/agent/config";
import { Tool } from "@langchain/core/tools";
import { BaseMessage } from "@langchain/core/messages";
import {
  AgentConfigurableOptions,
  AgentConfig,
  AgentMetadata,
} from "@/lib/langchain/agent/config";

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

export interface Thread {
  thread_id: string;
  metadata: {
    user_id: string;
    assistant_id: string;
    title?: string;
    [key: string]: unknown;
  };
  status: string;
  created_at: string;
  updated_at: string;
  config?: ThreadConfig;
}

export interface Assistant {
  graph_id: string;
  assistant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: AgentMetadata;
  version: number;
  config: AgentConfigurableOptions;
}

export interface Stream {
  assistant_id: string;
  checkpoint: Checkpoint;
  input: Record<string, unknown>;
  command: Record<string, unknown>;
  metadata: Record<string, unknown>;
  config: AgentConfigurableOptions;
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

export interface StreamEvent {
  event: string;
  data: {
    content?: string;
    type?: string;
    [key: string]: unknown;
  }[];
}

// Main agent configuration interface (extending the Zod-based type)
export interface AgentConfigWithTools extends AgentConfig {
  tools: Tool[];
}

export interface AgentState {
  messages: BaseMessage[];
  metadata: AgentMetadata;
  title?: string;
  [key: string]: unknown;
}

// For the modal props
export interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  initialConfig: AgentConfigWithTools;
  onSave?: (config: AgentConfigWithTools) => void;
}
