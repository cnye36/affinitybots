import { ChatOpenAI } from "@langchain/openai";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { retrieveRelevantDocuments } from "@/lib/retrieval";
import { createClient } from "@/supabase/server";
import { getTools } from "../tools";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentConfigurableOptions } from "./config";
import { AgentState } from "@/types";

// Define your tools
const tools = getTools();

// Define the knowledge retrieval node
async function retrieveKnowledge(state: AgentState) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  try {
    const supabase = await createClient();
    const relevantDocs = await retrieveRelevantDocuments(
      lastMessage.content.toString(),
      supabase
    );

    // If no relevant documents found, continue with original messages
    if (relevantDocs.length === 0) {
      return { messages: state.messages };
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
    return { messages: state.messages };
  }
}

// Define the function to call the model
async function callModel(state: AgentState, config: RunnableConfig) {
  const configurable = config.configurable as AgentConfigurableOptions;

  // Initialize the model with tool calling capabilities
  const model = new ChatOpenAI({
    model: configurable?.model || "gpt-4o",
    temperature: configurable?.temperature || 0.7,
  }).bindTools(tools);

  // Get the custom prompt template from configuration or fall back to default
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

  // Invoke the model with the current conversation state
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages.map(
      (message) => new HumanMessage(message.content.toString())
    ),
  ]);

  // Return the model's response
  return { messages: response };
}

// Determine the next step based on the model's output
function routeModelOutput(state: AgentState) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // If the model wants to call tools, route to the tools node
  if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
    return "tools";
  }

  // Otherwise, end the graph
  return "__end__";
}

// Create the workflow
const workflow = new StateGraph(MessagesAnnotation)
  // Add nodes for knowledge retrieval, model calling, and tools
  .addNode("knowledge", retrieveKnowledge)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(tools))

  // Set the entry point to knowledge retrieval
  .addEdge("__start__", "knowledge")

  // Always go to model after knowledge retrieval
  .addEdge("knowledge", "callModel")

  // Add conditional edges to handle tool calls
  .addConditionalEdges("callModel", routeModelOutput, ["tools", "__end__"])

  // After using tools, go back to calling the model
  .addEdge("tools", "callModel");

// Compile the graph
export const graph = workflow.compile({
  checkpointer: new MemorySaver(),
});
