import { ChatOpenAI } from "@langchain/openai";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { retrieveRelevantDocuments } from "@/lib/retrieval";
import { createClient } from "@/supabase/server";

type AgentState = {
  messages: BaseMessage[];
  config?: {
    assistant_id: string;
  };
};

// Define your tools
const tools = [
  new TavilySearchResults({ maxResults: 3 }),
  // Add more tools as needed
];

// Define the knowledge retrieval node
async function retrieveKnowledge(state: AgentState) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];

  // Skip if no assistant_id in state or if it's not a user message
  if (!state.config?.assistant_id || !(lastMessage instanceof HumanMessage)) {
    return { messages: state.messages };
  }

  try {
    const supabase = await createClient();
    const relevantDocs = await retrieveRelevantDocuments(
      lastMessage.content.toString(),
      supabase,
      state.config.assistant_id
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
async function callModel(state: AgentState) {
  // Initialize the model with tool calling capabilities
  const model = new ChatOpenAI({
    model: "gpt-4o",
  }).bindTools(tools);

  // Invoke the model with the current conversation state
  const response = await model.invoke([
    new SystemMessage(
      "You are a helpful assistant that can use tools to answer questions. When provided with relevant context, use it to inform your responses."
    ),
    ...state.messages,
  ]);

  // Return the model's response
  return { messages: response };
}

// Determine the next step based on the model's output
function routeModelOutput(state: AgentState) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

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
export const graph = workflow.compile();
