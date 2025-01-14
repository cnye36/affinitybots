// lib/langchain/types.ts
import { BaseMessage } from "@langchain/core/messages";

export interface ChatState {
  messages: BaseMessage[];
  metadata: {
    agentId: string;
    threadId?: string;
    workflowId?: string;
    taskId?: string;
  };
}

export interface ChatConfig {
  configurable: {
    thread_id: string;
  };
}
