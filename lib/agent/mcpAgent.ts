import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import {
  StateGraph,
  MessagesAnnotation,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";

// Cache for MCP clients and tools to avoid recreating them on every call
const mcpClientCache = new Map<string, { client: MultiServerMCPClient; tools: any[] }>();

// Function to create MCP client and get tools
async function createMcpClientAndTools(config: any = {}) {
  const cacheKey = JSON.stringify(config);
  
  // Check cache first
  if (mcpClientCache.has(cacheKey)) {
    return mcpClientCache.get(cacheKey)!;
  }

  try {
    // Default MCP server configuration - can be overridden via config
    const defaultServers = {
      
      exa: {
        url: "https://server.smithery.ai/exa/mcp?api_key=6f690ad1-0529-4d10-9668-e2c519230d3e&profile=eligible-bug-FblvFg",
         
        automaticSSEFallback: false
      },
      supabase: {
        url: "https://server.smithery.ai/@supabase-community/supabase-mcp/mcp?api_key=6f690ad1-0529-4d10-9668-e2c519230d3e&profile=eligible-bug-FblvFg",
        automaticSSEFallback: false
      }
    };

    // Use configured servers or defaults
    const mcpServers = config.mcpServers || defaultServers;

    if (Object.keys(mcpServers).length === 0) {
      return { client: null, tools: [] };
    }

    // Create MultiServerMCPClient
    console.log(`Creating MultiServerMCPClient with servers:`, Object.keys(mcpServers));
    
    const client = new MultiServerMCPClient({
      mcpServers,
      useStandardContentBlocks: true,
      throwOnLoadError: false, // Don't throw on individual tool load errors
      prefixToolNameWithServerName: false,
      additionalToolNamePrefix: "",
    });

    // Get all tools from all servers
    console.log(`Getting tools from MCP client...`);
    const tools = await client.getTools();
    console.log(`MCP client returned ${tools.length} tools`);
    
    const result = { client, tools };
    mcpClientCache.set(cacheKey, result);
    
    console.log(`Loaded ${tools.length} tools from ${Object.keys(mcpServers).length} MCP servers`);
    if (tools.length > 0) {
      console.log(`Tool names: ${tools.map(t => t.name).join(", ")}`);
    }
    
    return result;
  } catch (error) {
    console.error("Error creating MCP client and tools:", error);
    return { client: null, tools: [] };
  }
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to various MCP (Model Context Protocol) tools. 

You have access to:
- Math tools for calculations and mathematical operations
- Filesystem tools for file operations (when available)
- Additional tools depending on your configuration

Use these tools actively when they would help answer the user's questions. Don't hesitate to call tools when appropriate - they are there to help you provide better, more accurate responses.`;

// Define the function that calls the model with MCP tools
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: LangGraphRunnableConfig
) {
  const agentConfig = config.configurable || {};
  const systemPrompt = agentConfig.prompt_template || DEFAULT_SYSTEM_PROMPT;
  
  // Load MCP tools based on configuration
  const mcpConfig = agentConfig.mcpConfig || {};
  const { tools } = await createMcpClientAndTools(mcpConfig);
  
  console.log(`MCP Agent: Binding ${tools.length} tools to model`);
  
  // Create a model and give it access to the tools
  const baseModel = new ChatOpenAI({
    model: agentConfig.model || "gpt-4o-mini",
    temperature: agentConfig.temperature || 0,
  });
  
  console.log(`Binding ${tools.length} tools to ${baseModel.modelName} model...`);
  const model = baseModel.bindTools(tools);
  
  console.log(`Invoking model with ${tools.length} bound tools...`);
  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    ...state.messages,
  ]);
  
  console.log(`Model response received. Tool calls count: ${response.tool_calls?.length || 0}`);
  
  return { messages: [response] };
}

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  console.log(`Checking if should continue. Tool calls found: ${lastMessage.tool_calls?.length || 0}`);
  
  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    console.log(`Routing to tools node. Tool calls:`, lastMessage.tool_calls.map(tc => tc.name));
    return "tools";
  }
  console.log("No tool calls found, ending conversation");
  return "__end__";
}

// Create a dynamic tool node that loads tools at runtime
async function createToolNode(state: any, config: any): Promise<any> {
  const agentConfig = config.configurable || {};
  const mcpConfig = agentConfig.mcpConfig || {};
  
  console.log(`Tool node: Loading MCP tools`);
  
  // Get the same tools that were used in callModel
  const { tools } = await createMcpClientAndTools(mcpConfig);
  
  console.log(`Tool node: Executing with ${tools.length} available tools`);
  
  // Create a standard ToolNode with the loaded tools
  const toolNode = new ToolNode(tools);
  
  // Debug the incoming state for tool execution
  const lastMessage = state.messages?.[state.messages.length - 1];
  console.log(`Tool node executing. Last message tool_calls:`, lastMessage?.tool_calls?.map((tc: any) => tc.name) || []);
  
  // Invoke the tool node
  console.log(`About to invoke ToolNode with ${tools.length} tools...`);
  const result = await toolNode.invoke(state, config);
  
  console.log(`ToolNode execution completed. Result messages: ${result.messages?.length || 0}`);
  
  return result;
}

// Define and export the graph for LangGraph Platform
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", createToolNode)

  // Flow from start to agent
  .addEdge("__start__", "agent")

  // Tool usage cycles back to agent
  .addEdge("tools", "agent")

  // Conditional path from agent based on whether additional tools are needed
  .addConditionalEdges("agent", shouldContinue);

// ============================================================================
// LANGGRAPH PLATFORM DEPLOYMENT - MCP AGENT
// ============================================================================
// This is a simplified MCP-focused graph for LangGraph Studio
// 
// Architecture:
// 1. Agent node: Calls the LLM with MCP tools bound
// 2. Tools node: Executes MCP tool calls
// 3. Configurable via config.configurable.mcpConfig
//
// Benefits:
// ✅ MCP tool integration
// ✅ Configurable server setup
// ✅ Tool caching for performance
// ✅ Error handling for tool failures
// ============================================================================

export const graph = workflow.compile();