import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import {
  MultiServerMCPClient,
  Connection,
  StdioConnection,
  SSEConnection,
} from "@langchain/mcp-adapters";
import * as dotenv from "dotenv";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentConfiguration } from "@/types/agent";
import fs from "fs";

// Load environment variables
dotenv.config();

// Function to get enabled MCP servers configuration
interface MCPServerConfig {
  transport?: "stdio" | "sse";
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  useNodeEventSource?: boolean;
}

// Get the enabled MCP servers configuration
function getEnabledMCPServers(enabledServers: string[]) {
  const allServers = JSON.parse(
    fs.readFileSync("./lib/langchain/agent/mcp.json", "utf-8")
  ).servers as Record<string, MCPServerConfig>;

  const enabledServerConfig: Record<string, Connection> = {};
  enabledServers.forEach((serverName) => {
    if (allServers[serverName]) {
      const serverConfig = allServers[serverName];

      if (serverConfig.transport === "sse" && serverConfig.url) {
        const sseConfig: SSEConnection = {
          transport: "sse",
          url: serverConfig.url,
          headers: serverConfig.headers,
          useNodeEventSource: serverConfig.useNodeEventSource,
        };
        enabledServerConfig[serverName] = sseConfig;
      } else if (serverConfig.command && serverConfig.args) {
        const stdioConfig: StdioConnection = {
          transport: "stdio",
          command: serverConfig.command,
          args: serverConfig.args,
          env: serverConfig.env,
        };
        enabledServerConfig[serverName] = stdioConfig;
      } else {
        console.warn(
          `Server "${serverName}" has invalid configuration. Skipping.`
        );
      }
    }
  });

  return enabledServerConfig;
}

// Initialize MCP client with enabled servers
async function initializeMCPClient(enabledServers: string[]) {
  const mcpConfig = getEnabledMCPServers(enabledServers);
  const mcpClient = new MultiServerMCPClient(mcpConfig);
  await mcpClient.initializeConnections();
  return mcpClient.getTools();
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant that can use tools to find information`;

// Initialize base tools and model
const baseTools = await initializeMCPClient([
  "memory",
  "brave_search",
  "tavily",
  "sequential-thinking",
]);
const toolNode = new ToolNode(baseTools);

// Create a model and give it access to the tools
const model = new ChatOpenAI({
  model: "gpt-4.1",
  temperature: 0,
}).bindTools(baseTools);

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

// Define the function that calls the model
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: RunnableConfig
) {
  const agentConfig = config.configurable as AgentConfiguration;
  const systemPrompt = agentConfig.prompt_template || DEFAULT_SYSTEM_PROMPT;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages,
  ]);

  return { messages: [response] };
}

// Define and export the graph for LangGraph Platform
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addEdge("__start__", "agent")
  .addNode("tools", toolNode)
  .addEdge("tools", "agent")
  .addConditionalEdges("agent", shouldContinue);

// Export the compiled graph for platform deployment
export const graph = workflow.compile();

// Export the creation function for direct usage in non-platform contexts
export async function createAgentGraph(config: AgentConfiguration) {
  const tools = await initializeMCPClient(
    config.enabled_mcp_servers || ["tavily"]
  );
  const toolNode = new ToolNode(tools);

  const customModel = new ChatOpenAI({
    model: "gpt-4.1",
    temperature: 0,
  }).bindTools(tools);

  const customWorkflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state, runConfig) => {
      const agentConfig = runConfig.configurable as AgentConfiguration;
      const systemPrompt = agentConfig.prompt_template || DEFAULT_SYSTEM_PROMPT;

      const response = await customModel.invoke([
        new SystemMessage(systemPrompt),
        ...state.messages,
      ]);

      return { messages: [response] };
    })
    .addEdge("__start__", "agent")
    .addNode("tools", toolNode)
    .addEdge("tools", "agent")
    .addConditionalEdges("agent", shouldContinue);

  return customWorkflow.compile();
}
