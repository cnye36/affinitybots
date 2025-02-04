import { ChatOpenAI } from "@langchain/openai";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { retrieveRelevantDocuments } from "@/lib/retrieval";
import { createClient } from "@/supabase/server";
import { getTools } from "../../tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentConfigurableOptions } from "../config";
import { metadata } from "@/app/layout";

// Extend the agent state to include persistent memories.
type AgentState = {
  messages: BaseMessage[];
  metadata?: {
    assistant_id: string;
  };
  // (Optional) field to hold persistent memory context if needed.
  // Not strictly required since we inject it as a SystemMessage.
};

// ---------- Persistent Memory Store ----------
// In a production app, replace this with a persistent store (e.g. a DB or vector store)
const persistentMemoryStore = new Map<string, string[]>();

// ---------- New Node: Load Persistent Memory ----------
// This node loads persistent memory (if any) for the current user and prepends it as a SystemMessage.
async function loadPersistentMemory(
  state: AgentState,
  config: RunnableConfig
): Promise<AgentState> {
  const userId = metadata.owner_id;
  const memories = persistentMemoryStore.get(userId) || [];
  if (memories.length > 0) {
    const memoryContext = new SystemMessage(
      `Persistent Memory:\n${memories.join("\n")}`
    );
    return { ...state, messages: [memoryContext, ...state.messages] };
  }
  return state;
}

// ---------- Existing Knowledge Retrieval Node, Enhanced ----------
async function retrieveKnowledge(state: AgentState): Promise<AgentState> {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Skip if no assistant_id in state or if it's not a user message
  if (!state.metadata?.assistant_id || !(lastMessage instanceof HumanMessage)) {
    return { messages: state.messages };
  }

  try {
    const supabase = await createClient();
    const relevantDocs = await retrieveRelevantDocuments(
      lastMessage.content.toString(),
      supabase,
      state.metadata.assistant_id
    );

    // If relevant docs are found, update the persistent memory store.
    if (relevantDocs.length > 0) {
      const userId = state.metadata.assistant_id;
      const existingMemories = persistentMemoryStore.get(userId) || [];
      // Extract content and merge uniquely.
      const newMemories = relevantDocs.map((doc) => doc.pageContent);
      const updatedMemories = Array.from(
        new Set([...existingMemories, ...newMemories])
      );
      persistentMemoryStore.set(userId, updatedMemories);
    }

    // If no relevant documents found, continue with original messages.
    if (relevantDocs.length === 0) {
      return { messages: state.messages };
    }

    // Create a context message from retrieved documents.
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
    return { messages: state.messages };
  }
}

// ---------- Existing Model Invocation Node ----------
async function callModel(
  state: AgentState,
  config: RunnableConfig
): Promise<AgentState> {
  const configurable = config.configurable as AgentConfigurableOptions;

  // Initialize the model with tool calling capabilities
  const model = new ChatOpenAI({
    model: configurable?.model || "gpt-4o",
    temperature: configurable?.temperature || 0.7,
  }).bindTools(getTools());

  // Get the custom prompt template from configuration or use default
  const systemPrompt =
    configurable?.prompt_template ||
    `You are a sophisticated AI assistant designed to solve complex tasks efficiently. When given a query, carefully analyze whether existing tools can help you provide a more accurate, comprehensive, or up-to-date response. Tools should be used strategically to: 

    1. Retrieve current or specialized information not in your base knowledge
    2. Verify facts from authoritative sources
    3. Perform complex calculations or specialized queries
    4. Access real-time or domain-specific data

    Always prioritize tool usage when:
    - The query requires recent information
    - Precise numerical or scientific calculations are needed
    - Specific domain expertise is required
    - Direct source verification would enhance response quality

    When relevant context is provided, integrate it thoughtfully with tool-retrieved information to create a nuanced, well-informed response. Your goal is to provide the most accurate and helpful information possible.`;

  // Invoke the model with system prompt and current messages
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages,
  ]);

  return { messages: response };
}

// ---------- Routing Node remains unchanged ----------
function routeModelOutput(state: AgentState): string {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the model wants to call tools, route to the tools node
  if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
    return "tools";
  }
  // Otherwise, end the graph
  return "__end__";
}

// ---------- Build the Graph ----------

// Create the workflow graph.
// We now add the new persistent memory node ("loadMemory") at the start.
const workflow = new StateGraph(MessagesAnnotation)
  // Start with loading persistent memory.
  .addNode("loadMemory", loadPersistentMemory)
  // Then load context from the knowledge base.
  .addNode("knowledge", retrieveKnowledge)
  // Next, call the model.
  .addNode("callModel", callModel)
  // Add the tools node (unchanged).
  .addNode("tools", new ToolNode(getTools()))

  // Graph edges:
  // __start__ -> loadMemory -> knowledge -> callModel
  .addEdge("__start__", "loadMemory")
  .addEdge("loadMemory", "knowledge")
  .addEdge("knowledge", "callModel")

  // Conditional edge from callModel: if there are tool calls, go to "tools"; else end.
  .addConditionalEdges("callModel", routeModelOutput, ["tools", "__end__"])
  // After executing tools, go back to callModel.
  .addEdge("tools", "callModel");

// Compile the graph with a MemorySaver for checkpointing.
export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});
