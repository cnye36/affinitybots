// lib/langchain/chat.ts
import { ChatOpenAI } from "@langchain/openai";
import {
  START,
  END,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
  InMemoryStore,
  BaseStore,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AgentConfig } from "@/types/agent";
import { AgentState } from "@/types/agent";
import {
  SystemMessage,
  BaseMessage,
  HumanMessage,
  MessageContent,
} from "@langchain/core/messages";
import { initializeTools } from "@/lib/langchain/tools";

// Create a singleton InMemoryStore instance
const memoryStore = new InMemoryStore();

// Update AgentState type at the top of the file
interface ExtendedAgentState extends AgentState {
  metadata: {
    assistantId: string;
    threadId?: string;
    userId?: string;
  };
}

// Helper function to manage memories
async function manageMemories(
  store: BaseStore,
  userId: string,
  content: MessageContent,
  type: "read" | "write"
) {
  const namespace = `${userId}_memories`;

  if (type === "write") {
    const memoryId = crypto.randomUUID();
    await store.put([namespace], memoryId, { memory: String(content) });
    return;
  }

  // Read/search memories
  const memories = await store.search([namespace], { query: String(content) });
  return memories.map((m) => m.value.memory).join("\n");
}

// Create and compile the base workflow
const baseWorkflow = new StateGraph(MessagesAnnotation)
  .addNode("model", async (state: AgentState) => {
    console.log("[callModel] Input state:", state);
    const messages = state.messages || [];
    console.log("[callModel] Processing messages:", messages);

    try {
      const model = new ChatOpenAI({
        modelName: "gpt-4o", // Default model
        temperature: 0.7,
        streaming: true,
      });

      const response = await model.invoke([
        new SystemMessage("You are a helpful AI assistant."),
        ...messages,
      ]);

      return {
        messages: [...messages, response],
        metadata: { ...state.metadata },
      };
    } catch (error) {
      console.error("[callModel] Error:", error);
      throw error;
    }
  })
  .addNode("tools", new ToolNode([]))
  .addEdge(START, "model")
  .addConditionalEdges(
    "model",
    (state: typeof MessagesAnnotation.State) => {
      const messages = state.messages;
      const lastMessage = messages[messages.length - 1];
      return (lastMessage?.additional_kwargs?.tool_calls?.length ?? 0) > 0
        ? "tools"
        : END;
    },
    ["tools", END]
  )
  .addEdge("tools", "model");

// Export the compiled base workflow as 'agent'
export const agent = baseWorkflow.compile();

export async function createChatGraph(agent: AgentConfig, threadId: string) {
  console.log("[createChatGraph] Creating chat graph for thread:", threadId);

  // Create the chat model with streaming
  const model = new ChatOpenAI({
    modelName: agent.model || "gpt-4o",
    temperature: agent.config?.temperature || 0.7,
    streaming: true,
  });

  // Initialize tools
  const tools = await initializeTools(agent.tools || []);

  // Bind tools to the model
  const modelWithTools = model.bind({
    tools: tools,
  });

  // Define the function that calls the model
  const callModel = async (state: ExtendedAgentState) => {
    console.log("[callModel] Input state:", state);
    const messages = state.messages || [];
    console.log("[callModel] Processing messages:", messages);

    try {
      // Get relevant memories for the current context
      const userId = state.metadata.userId;
      const lastMessage = messages[messages.length - 1];
      let relevantMemories = "";

      if (userId && lastMessage?.content) {
        relevantMemories = await manageMemories(
          memoryStore,
          userId,
          lastMessage.content,
          "read"
        );
      }

      // Add memories to the system message if they exist
      const systemMessages = [
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
      ];

      if (relevantMemories) {
        systemMessages.push(
          new SystemMessage(
            `Relevant memories about this user:\n${relevantMemories}`
          )
        );
      }

      const response = await modelWithTools.invoke([
        ...systemMessages,
        ...messages,
      ]);

      // Store the assistant's response as a memory if it seems important
      if (
        userId &&
        response.content &&
        !String(response.content).includes("tool_calls")
      ) {
        await manageMemories(memoryStore, userId, response.content, "write");
      }

      return {
        messages: [...messages, response],
        metadata: { ...state.metadata },
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
    store: memoryStore, // Add the memory store to the compilation
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
  assistantId: string,
  threadId: string,
  userId?: string,
  existingMessages: BaseMessage[] = []
): Promise<AgentState> {
  console.log("[createInitialState] Creating state with:", {
    message,
    assistantId,
    threadId,
    userId,
    existingMessagesCount: existingMessages.length,
  });

  // If there are existing messages, add them to the state
  const messages = [...existingMessages, new HumanMessage(message)];
  console.log("[createInitialState] Final messages:", messages);

  return {
    messages,
    metadata: {
      assistantId,
      threadId,
      userId, // Add userId to metadata
    },
  };
}
