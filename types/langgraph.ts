import { BaseStore } from "@langchain/langgraph";
import { Tool } from "@langchain/core/tools";

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
export interface ThreadState {
  values: {
    messages: Message[];
    title?: string;
    [key: string]: unknown;
  };
  checkpoint?: Checkpoint;
  checkpointId?: string;
  asNode?: string;
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

// Update Message type to match what the API expects
export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Assistant {
  graph_id: string;
  assistant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  metadata: {
    description: string;
    agent_type: string;
    owner_id: string;
    [key: string]: string | unknown;
  };
  version: number;
  config: {
    configurable: {
      model?: string;
      temperature?: number;
      instructions?: string;
      prompt_template?: string;
      tools?: Record<string, unknown>;
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

export interface AgentState {
  messages: Message[];
  tools: Tool[];
  store: BaseStore;
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

export interface StreamEvent {
  event: string;
  data: {
    content?: string;
    type?: string;
    [key: string]: unknown;
  }[];
}
