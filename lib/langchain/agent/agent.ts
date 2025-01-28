import { ChatOpenAI } from "@langchain/openai";
import {
  createReactAgent,
  type CreateReactAgentParams,
} from "@langchain/langgraph/prebuilt";
import { MemorySaver, InMemoryStore } from "@langchain/langgraph";
import { initializeTools } from "@/lib/langchain/tools";
import type { AgentConfigurableOptions } from "./config";

// Create a singleton memory store for cross-thread memory
const memoryStore = new InMemoryStore();

// Create the base graph that will be configured by assistants
export function createBaseGraph() {
  // Create the base graph with memory support
  return createReactAgent({
    llm: new ChatOpenAI({ streaming: true }),
    tools: [], // Tools will be configured per assistant
    checkpointSaver: new MemorySaver(),
    store: memoryStore,
  } as CreateReactAgentParams);
}

// Export the compiled base workflow
export const agent = createBaseGraph();

// Helper function to create a configured instance of the graph
export async function createConfiguredAgent(config: {
  configurable: AgentConfigurableOptions;
}) {
  const tools = await initializeTools(config.configurable.tools);

  return createReactAgent({
    llm: new ChatOpenAI({
      modelName: config.configurable.model,
      temperature: config.configurable.temperature,
      streaming: true,
    }),
    tools,
    checkpointSaver: new MemorySaver(),
    store: memoryStore,
    systemMessage: config.configurable.prompt_template,
  } as CreateReactAgentParams);
}

