import { v4 as uuidv4 } from "uuid";
import { ChatOpenAI } from "@langchain/openai";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
  BaseStore,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import { retrieveRelevantDocuments } from "@/lib/retrieval";
import { createClient } from "@/supabase/server";
import { getTools } from "../tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentConfigurableOptions } from "./config";
import { AgentState } from "@/types";

// Define your tools
const tools = getTools({
  web_search: { isEnabled: true, config: {}, credentials: {} },
  wikipedia: { isEnabled: false, config: {}, credentials: {} },
  wolfram_alpha: { isEnabled: false, config: {}, credentials: {} },
  notion: { isEnabled: false, config: {}, credentials: {} },
  twitter: { isEnabled: false, config: {}, credentials: {} },
  google: { isEnabled: false, config: {}, credentials: {} },
});

/**
 * Retrieve external context (if needed) from a retrieval service.
 */
async function retrieveKnowledge(
  state: AgentState & { config: RunnableConfig; store: BaseStore }
): Promise<{ messages: BaseMessage[] }> {
  const messages = state.messages.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );
  const lastMessage = messages[messages.length - 1];

  try {
    const supabase = await createClient();
    const relevantDocs = await retrieveRelevantDocuments(
      lastMessage.content.toString(),
      supabase
    );

    // If no relevant documents found, continue with original messages
    if (relevantDocs.length === 0) {
      return { messages };
    }

    // Add retrieved context as a system message
    const contextMessage = new SystemMessage(
      `Relevant context from knowledge base:\n${relevantDocs
        .map((doc) => doc.pageContent)
        .join("\n\n")}`
    );

    return {
      messages: [...messages.slice(0, -1), contextMessage, lastMessage],
    };
  } catch (error) {
    console.error("Error retrieving knowledge:", error);
    return { messages };
  }
}

/**
 * Call the model and inject retrieved memories into the system prompt.
 */
async function callModel(
  state: AgentState & { config: RunnableConfig; store: BaseStore }
): Promise<{ messages: BaseMessage[] }> {
  const configurable = state.config.configurable as AgentConfigurableOptions;
  let memoryPrompt = "";

  if (configurable.memory.enabled) {
    // Assume the user is identified by the owner_id (or adjust as needed)
    const userId = configurable.owner_id;
    const memories = await state.store.search(["memories", userId]);
    if (memories.length > 0) {
      // Use a sliding window based on max_entries (and optionally incorporate relevance_threshold)
      const selectedMemories = memories.slice(-configurable.memory.max_entries);
      const memoryTexts = selectedMemories.map((mem) => mem.value.data);
      memoryPrompt = "User Memories:\n" + memoryTexts.join("\n\n");
    }
  }

  const systemPrompt =
    configurable.prompt_template ||
    `You are a sophisticated AI assistant designed to solve complex tasks efficiently.
When responding, consider both the current conversation and any previously stored user memories.`;

  // Prepend the memory context (if any) to the system prompt.
  const finalSystemPrompt = memoryPrompt
    ? `${systemPrompt}\n\n${memoryPrompt}`
    : systemPrompt;

  // Initialize the model with tool calling capabilities
  const model = new ChatOpenAI({
    model: configurable?.model || "gpt-4o",
    temperature: configurable?.temperature || 0.7,
  }).bindTools(tools);

  const messages = state.messages.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content)
  );

  const response = await model.invoke([
    new SystemMessage(finalSystemPrompt),
    ...messages,
  ]);

  return { messages: Array.isArray(response) ? response : [response] };
}

/**
 * Update the memory store with any information the user instructs the agent to remember.
 * For example, if the user's message starts with "remember:", we extract and save that memory.
 */
async function updateMemory(
  state: AgentState & { config: RunnableConfig; store: BaseStore }
): Promise<{ messages: BaseMessage[] }> {
  const configurable = state.config.configurable as AgentConfigurableOptions;

  if (!configurable.memory.enabled) {
    return {
      messages: state.messages.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ),
    };
  }

  const lastMessage = state.messages[state.messages.length - 1];
  if (
    typeof lastMessage.content === "string" &&
    lastMessage.content.toLowerCase().startsWith("remember:")
  ) {
    // Remove the prefix ("remember:") and trim the content.
    const memoryContent = lastMessage.content
      .substring("remember:".length)
      .trim();
    const userId = configurable.owner_id;
    const namespace = ["memories", userId];
    const memoryId = uuidv4();
    await state.store.put(namespace, memoryId, { data: memoryContent });
    console.log(`Stored new memory for user ${userId}:`, memoryContent);
  }

  return {
    messages: state.messages.map((msg) =>
      msg.role === "user"
        ? new HumanMessage(msg.content)
        : new AIMessage(msg.content)
    ),
  };
}

/**
 * Determine the next step based on the model output.
 */
function routeModelOutput(state: { messages: BaseMessage[] }) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const toolCalls = (lastMessage as AIMessage & { tool_calls?: ToolCall[] })
    .tool_calls;

  if (lastMessage && toolCalls && toolCalls.length > 0) {
    return "tools";
  }
  return "__end__";
}

/**
 * Create the workflow graph.
 * Note that we add an extra "updateMemory" node so that memory is updated after the model call.
 */
const workflow = new StateGraph(MessagesAnnotation)
  // Add nodes for knowledge retrieval, model calling, and tools
  .addNode("knowledge", retrieveKnowledge)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(tools))
  .addNode("updateMemory", updateMemory) // New node to write memory
  .addEdge("__start__", "knowledge")
  .addEdge("knowledge", "callModel")
  .addEdge("callModel", "updateMemory") // Update memory right after model call
  .addConditionalEdges("updateMemory", routeModelOutput, ["tools", "__end__"])
  .addEdge("tools", "callModel");

// Compile the graph with the MemorySaver (for per-thread state) and your shared store.
export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});
