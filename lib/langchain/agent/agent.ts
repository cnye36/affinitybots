import { ChatOpenAI } from "@langchain/openai";
import {
  MessagesAnnotation,
  StateGraph,
  START,
  END,
} from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  HumanMessage,
  SystemMessage,
  BaseMessage,
  AIMessage,
} from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import { RunnableConfig } from "@langchain/core/runnables";
// import { AgentConfigurableOptions } from "./config";
import { AgentState } from "@/types/langgraph";
import { retrieveRelevantDocuments } from "@/lib/retrieval";
import { createClient } from "@/supabase/server";
// import { getTools } from "@/lib/langchain/tools";

import { AgentConfiguration } from "@/types/agent";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const mcpClient = new MultiServerMCPClient();

await mcpClient.initializeConnections();
const mcpTools = mcpClient.getTools();

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant that can use tools to find information.
When you need to find current or factual information, use the search tool.
For Wikipedia information, use the Wikipedia tool.
For mathematical calculations or scientific queries, use the Wolfram Alpha tool.
For Notion operations, use the Notion tool.
For Twitter interactions, use the Twitter tool.
For Google services, use the Google tool.
Always think step by step and explain your reasoning.`;

/**
 * Retrieve relevant knowledge from the agent's knowledge base
 */
async function retrieveKnowledge(
  state: AgentState,
  config: RunnableConfig
): Promise<{ messages: BaseMessage[] }> {
  const agentConfig = config.configurable as AgentConfiguration;
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Only proceed with knowledge retrieval if it's enabled in config
  if (!agentConfig.knowledge_base?.isEnabled) {
    return { messages };
  }

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
 * Basic call model function that accepts configuration
 */
async function callModel(
  state: AgentState,
  config: RunnableConfig
): Promise<{ messages: BaseMessage[] }> {
  const agentConfig = config.configurable as AgentConfiguration;
  const systemPrompt = agentConfig.prompt_template || DEFAULT_SYSTEM_PROMPT;

  // Initialize the model with tool calling capabilities
  const model = new ChatOpenAI({
    model: agentConfig.model,
    temperature: agentConfig.temperature,
  }).bindTools(mcpTools);

  const messages = state.messages.map((msg) =>
    msg instanceof HumanMessage
      ? new HumanMessage(msg.content as string)
      : new AIMessage(msg.content as string)
  );

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...messages,
  ]);

  return { messages: Array.isArray(response) ? response : [response] };
}


/**
 * Simple routing function to determine if we need to use tools
 */
function routeModelOutput(state: { messages: BaseMessage[] }) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  const toolCalls = (lastMessage as AIMessage & { tool_calls?: ToolCall[] })
    .tool_calls;

  if (lastMessage && toolCalls && toolCalls.length > 0) {
    return "tools";
  }
  return END;
}

/**
 * Create a minimal ReAct style agent graph with configuration support
 */
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("knowledge", retrieveKnowledge)
  .addNode("callModel", callModel)
  .addNode("tools", new ToolNode(mcpTools))
  .addEdge(START, "knowledge")
  .addEdge("knowledge", "callModel")
  .addConditionalEdges("callModel", routeModelOutput, ["tools", END])
  .addEdge("tools", "callModel");

// Compile the graph
export const graph = workflow.compile();
