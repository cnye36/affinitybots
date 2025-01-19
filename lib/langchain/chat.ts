// lib/langchain/chat.ts
import { ChatOpenAI } from "@langchain/openai";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentConfig } from "@/types/agent";
import { ChatState } from "./types";
import {
  SystemMessage,
  BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import { initializeTools } from "../tools";

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

  // Initialize tools
  const tools = await initializeTools(agent.tools || []);

  // Bind tools to the model
  const modelWithTools = model.bind({
    tools: tools,
  });

  // Define the function that calls the model
  const callModel = async (state: ChatState) => {
    console.log("[callModel] Input state:", state);
    const messages = state.messages || [];
    console.log("[callModel] Processing messages:", messages);

    try {
      const response = await modelWithTools.invoke([
        new SystemMessage(
          agent.prompt_template || "You are a helpful AI assistant."
        ),
        new SystemMessage(`You have access to the following tools:
${tools.map((tool) => `- ${tool.name}: ${tool.description}`).join("\n")}

When using tools:
1. Always try to use tools when relevant instead of using your own knowledge
2. Some tools require user approval before execution
3. You can only use one tool at a time
4. Wait for tool execution to complete before proceeding`),
        ...messages,
      ]);

      return {
        messages: [...messages, response],
        metadata: { ...state.metadata },
        toolUsage: state.toolUsage,
      };
    } catch (error) {
      console.error("[callModel] Error:", error);
      throw error;
    }
  };

  // Define the router function
  const routeModelOutput = (state: typeof MessagesAnnotation.State) => {
    const messages = state.messages;
    const lastMessage = messages[messages.length - 1];

    // If the LLM is invoking tools, route there
    if ((lastMessage?.additional_kwargs?.tool_calls?.length ?? 0) > 0) {
      return "tools";
    }

    // Otherwise end the graph
    return END;
  };

  // Create the tool node
  const toolNode = new ToolNode(tools);

  // Define the graph
  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addNode("tools", toolNode)
    .addEdge(START, "model")
    .addConditionalEdges("model", routeModelOutput, ["tools", END])
    .addEdge("tools", "model");

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
