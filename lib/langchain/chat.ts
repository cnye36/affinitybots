// lib/langchain/chat.ts
import { ChatOpenAI } from "@langchain/openai";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { AgentConfig } from "@/types/agent";
import { ChatState } from "./types";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";

export async function createChatGraph(agent: AgentConfig, threadId: string) {
  console.log("[createChatGraph] Creating chat graph for thread:", threadId);

  // Create the chat model with streaming
  const model = new ChatOpenAI({
    modelName: agent.model_type,
    temperature: agent.config?.temperature || 0.7,
    streaming: true,
    callbacks: [
      {
        handleLLMNewToken(token: string) {
          console.log("[LLM Token]", token);
          return Promise.resolve();
        },
        handleLLMEnd(output) {
          console.log("[LLM End]", output);
          return Promise.resolve();
        },
        handleLLMError(error) {
          console.error("[LLM Error]", error);
          return Promise.resolve();
        },
      },
    ],
  });

  // Define the function that calls the model
  const callModel = async (state: ChatState) => {
    console.log("[callModel] Input state:", state);
    const messages = state.messages || [];
    console.log("[callModel] Processing messages:", messages);

    try {
      const response = await model.invoke(messages);
      console.log("[callModel] Model response:", response);

      const newState = {
        messages: [...messages, response],
        metadata: { ...state.metadata },
      };
      console.log("[callModel] New state:", newState);
      return newState;
    } catch (error) {
      console.error("[callModel] Error:", error);
      throw error;
    }
  };

  // Define a new graph
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

  console.log("[createChatGraph] Created workflow");

  // Add memory with thread ID
  const memory = new MemorySaver();
  const app = workflow.compile({
    checkpointer: memory,
  });

  console.log("[createChatGraph] Compiled workflow with memory");

  return {
    app,
    config: {
      configurable: {
        thread_id: threadId,
      },
    },
  };
}

export async function createInitialState(
  message: string,
  agentId: string,
  threadId: string,
  existingMessages: BaseMessage[] = []
): Promise<ChatState> {
  console.log("[createInitialState] Creating state with:", {
    message,
    agentId,
    threadId,
    existingMessagesCount: existingMessages.length,
  });

  // If there are existing messages, add them to the state
  const messages = [...existingMessages, new HumanMessage(message)];
  console.log("[createInitialState] Final messages:", messages);

  return {
    messages,
    metadata: {
      agentId,
      threadId,
    },
  };
}
