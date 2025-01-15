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
  toolUsage?: {
    toolId: string;
    input: string;
    output?: string;
    status: "pending" | "approved" | "rejected" | "completed";
    requiresApproval: boolean;
  }[];
}

export interface ChatConfig {
  configurable: {
    thread_id: string;
  };
}
