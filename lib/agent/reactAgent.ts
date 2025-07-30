import { ChatOpenAI } from "@langchain/openai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { AgentState, ToolNode } from "@langchain/langgraph/prebuilt";
import {
  StateGraph,
  MessagesAnnotation,
  InMemoryStore,
  LangGraphRunnableConfig,
} from "@langchain/langgraph";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { RunnableConfig } from "@langchain/core/runnables";
import { AgentConfiguration } from "@/types/agent";
import { retrieveRelevantDocuments } from "@/lib/retrieval";
import fs from "fs";
import { createClient } from "@/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { getUserMcpServers } from "./getUserMcpServers";

// Initialize the memory store
export const store = new InMemoryStore();

// Cache for MCP clients and tools to avoid recreating them on every call
const mcpClientCache = new Map<string, { client: MultiServerMCPClient; tools: any[] }>();

// Function to create MCP client and get tools
async function createMcpClientAndTools(userId: string, enabledServers: string[]) {
  const cacheKey = `${userId}:${enabledServers.sort().join(",")}`;
  
  // Check cache first
  if (mcpClientCache.has(cacheKey)) {
    return mcpClientCache.get(cacheKey)!;
  }

  try {
    const allServers = await getUserMcpServers(userId);
    
    // Check if SMITHERY_API_KEY is set
    const smitheryApiKey = process.env.SMITHERY_API_KEY;
    if (!smitheryApiKey) {
      console.warn("SMITHERY_API_KEY environment variable is not set - MCP servers may not work");
    } else {
      console.log("SMITHERY_API_KEY is configured");
    }
    
    const mcpServers: Record<string, any> = {};

    // Build server configuration for MultiServerMCPClient
    for (const qualifiedName of enabledServers) {
      if (allServers[qualifiedName]) {
        const serverConfig = allServers[qualifiedName];
        
        // Convert to MultiServerMCPClient format - use the server config directly
        mcpServers[qualifiedName] = {
          transport: "streamable_http",
          url: serverConfig.url,
          headers: {
            ...(serverConfig.apiKey && { "Authorization": `Bearer ${serverConfig.apiKey}` }),
            "Content-Type": "application/json"
          },
          // Pass config directly to MultiServerMCPClient
          ...(serverConfig.config && Object.keys(serverConfig.config).length > 0 && {
            config: serverConfig.config
          })
        };
      }
    }

    if (Object.keys(mcpServers).length === 0) {
      return { client: null, tools: [] };
    }

    // Create MultiServerMCPClient
    console.log(`Creating MultiServerMCPClient with servers:`, Object.keys(mcpServers));
    console.log(`MCP Server configs:`, mcpServers);
    
    const client = new MultiServerMCPClient({
      mcpServers,
      useStandardContentBlocks: true,
      throwOnLoadError: false, // Don't throw on individual tool load errors
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
      console.log(`Tool details:`, tools.map(t => ({
        name: t.name,
        description: t.description,
        schema: t.schema || 'No schema',
        hasInvoke: typeof t.invoke === 'function',
        constructor: t.constructor?.name
      })));
    }
    
    return result;
  } catch (error) {
    console.error("Error creating MCP client and tools:", error);
    console.error("Error details:", error instanceof Error ? error.message : String(error));
    return { client: null, tools: [] };
  }
}

// Function to extract and write user memories
async function writeMemory(state: AgentState, config: LangGraphRunnableConfig) {
  const configurable =
    (config.configurable as {
      agentId?: string;
      memory?: { enabled: boolean };
    }) || {};
  const userId = configurable.agentId; // Using agentId as userId for now
  const memoryEnabled = configurable.memory?.enabled ?? true; // Default to enabled if not specified

  // Skip memory writing if memory is disabled or no userId
  if (!userId || !memoryEnabled) {
    return { messages: state.messages, has_memory_updates: false };
  }

  // We only analyze the most recent user message
  const userMessage = state.messages.at(-1);
  if (!userMessage || !(userMessage instanceof HumanMessage)) {
    return { messages: state.messages, has_memory_updates: false }; // Not a user message, pass through
  }

  // Get user message content
  const userContent =
    typeof userMessage.content === "string"
      ? userMessage.content
      : JSON.stringify(userMessage.content);

  try {
    // Use the LLM to extract memories from the message
    const memoryExtractor = new ChatOpenAI({
      model: "gpt-4.1-mini",
      temperature: 0,
    });

    const extractionPrompt = [
      new SystemMessage(
        `You are a memory extraction system. Extract any personal information about the user from this message. 
        Focus on their name, location, preferences, job, likes/dislikes, hobbies, or any other personal details.
        Format your response as a JSON object with the extracted information as key-value pairs.
        If no personal information is found, return an empty JSON object {}.
        For example: {"name": "John", "location": "New York", "likes": ["coffee", "hiking"]}
        Do not include any other text in your response, just the JSON object.`
      ),
      new HumanMessage(userContent),
    ];

    const extraction = await memoryExtractor.invoke(extractionPrompt);
    const extractedData = JSON.parse(extraction.content as string);

    // Only store if there's data extracted
    if (Object.keys(extractedData).length > 0) {
      // Add a message indicating memory is being updated
      const updatedMessages = [
        ...state.messages,
        new AIMessage("Updating memory..."),
      ];

      const namespace = ["user_profile", userId];
      const memoryId = uuidv4();

      // Check if any of the data already exists
      const existingMemories = await store.search(namespace, {
        filter: {},
      });
      const existingData: Record<string, unknown> = {};

      // Build a map of existing attribute types
      existingMemories.forEach((memory) => {
        const { attribute, value } = memory.value as {
          attribute: string;
          value: unknown;
        };
        if (attribute && value) {
          existingData[attribute] = value;
        }
      });

      console.log("Extracted new user data:", extractedData);

      // Store each piece of extracted information as a separate memory
      for (const [key, value] of Object.entries(extractedData)) {
        // Only store if it's new information or different from what we have
        if (
          !existingData[key] ||
          JSON.stringify(existingData[key]) !== JSON.stringify(value)
        ) {
          await store.put(namespace, `${key}_${memoryId}`, {
            attribute: key,
            value: value,
            extracted_at: new Date().toISOString(),
            source_message: userContent,
          });
          console.log(`Stored new memory: ${key} = ${JSON.stringify(value)}`);
        }
      }

      return { messages: updatedMessages, has_memory_updates: true };
    }
  } catch (error) {
    console.error("Error extracting or storing memory:", error);
  }

  // No memory updates
  return { messages: state.messages, has_memory_updates: false };
}

// Function to determine if there's memory to write
function shouldUpdateMemory(state: typeof MessagesAnnotation.State) {
  // Check if the writeMemory function added the has_memory_updates flag
  interface StateWithMemoryFlag {
    messages: Array<BaseMessage>;
    has_memory_updates?: boolean;
  }
  const stateWithMemoryFlag = state as StateWithMemoryFlag;
  return stateWithMemoryFlag.has_memory_updates === true
    ? "agent"
    : "skipMemory";
}

// Function to retrieve user memories
async function retrieveMemories(
  userId: string | undefined,
  memoryEnabled: boolean = true
) {
  if (!userId || !memoryEnabled) {
    return [];
  }

  const namespace = ["user_profile", userId];
  try {
    const memories = await store.search(namespace, { filter: {} });
    return memories;
  } catch (error) {
    console.error("Error retrieving memories:", error);
    return [];
  }
}

export async function retrieveKb(state: AgentState, config: RunnableConfig) {
  const configurable = (config.configurable as { agentId?: string }) || {};
  const { agentId } = configurable;

  let lastUserMsgContent = state.messages.at(-1)?.content ?? "";

  if (Array.isArray(lastUserMsgContent)) {
    lastUserMsgContent = lastUserMsgContent
      .filter(
        (part: unknown): part is { type: "text"; text: string } =>
          typeof part === "object" &&
          part !== null &&
          "type" in part &&
          (part as { type: string }).type === "text" &&
          "text" in part &&
          typeof (part as { text: string }).text === "string"
      )
      .map((part: { type: "text"; text: string }) => part.text)
      .join("\n");
  } else if (typeof lastUserMsgContent !== "string") {
    lastUserMsgContent = String(lastUserMsgContent);
  }

  const supabase = await createClient();
  const docs = await retrieveRelevantDocuments(
    lastUserMsgContent,
    supabase,
    6, // topK
    agentId
  );

  return {
    messages: docs.length
      ? [
          {
            type: "system",
            content:
              "You have access to the following information from relevant documents in your knowledge base. Use this information to answer the user's query:\n\n" +
              docs
                .map(
                  (d, i) =>
                    `Source Document Chunk ${i + 1} (from file: ${
                      d.metadata.filename || "unknown"
                    }):\n"""\n${d.pageContent}\n"""`
                )
                .join("\n\n---\n\n") +
              "\n\nBased on the above, and your general knowledge, please respond to the user.",
          },
        ]
      : [],
  };
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant that can use tools to find information. 

IMPORTANT: You have access to various tools and should actively use them when they would be helpful to answer the user's questions. Don't hesitate to call tools when appropriate - they are there to help you provide better, more accurate responses.

When you receive a question that could benefit from using a tool (like searching for information, getting data, or performing calculations), please use the available tools.`;

// --- MAIN ENTRY POINT ---

// Define the function that calls the model with dynamic configuration
async function callModel(
  state: typeof MessagesAnnotation.State,
  config: LangGraphRunnableConfig
) {
  const store = config.store;
  if (!store) {
    throw new Error("store is required when compiling the graph");
  }
  if (!config.configurable?.agentId) {
    throw new Error("agentId is required in the config");
  }
  
  const agentConfig = config.configurable as AgentConfiguration;
  const userId = config.configurable.agentId as string;
  const systemPrompt = agentConfig.prompt_template || DEFAULT_SYSTEM_PROMPT;
  const memoryEnabled = agentConfig.memory?.enabled ?? true;
  
  // Retrieve user memories
  const memories = await retrieveMemories(userId, memoryEnabled);
  
  // Format memories for inclusion in the prompt
  let memoryContext = "";
  if (memories.length > 0 && memoryEnabled) {
    memoryContext = "\n\nUser Profile Information:\n";
    const profileData: Record<string, unknown> = {};
    memories.forEach((memory) => {
      const { attribute, value } = memory.value as {
        attribute: string;
        value: unknown;
      };
      if (attribute && value) {
        profileData[attribute] = value;
      }
    });
    for (const [attribute, value] of Object.entries(profileData)) {
      if (Array.isArray(value)) {
        memoryContext += `- ${attribute}: ${value.join(", ")}\n`;
      } else {
        memoryContext += `- ${attribute}: ${value}\n`;
      }
    }
  }

  // Load MCP tools
  const enabledServers = agentConfig.enabled_mcp_servers || [];
  const { tools } = await createMcpClientAndTools(userId, enabledServers);
  
  console.log(`Agent ${userId}: Binding ${tools.length} tools to model`);
  console.log(`Enabled servers: ${enabledServers.join(", ")}`);
  
  // Create a model and give it access to the tools
  const baseModel = new ChatOpenAI({
    model: agentConfig.model || "gpt-4.1-mini",
    temperature: agentConfig.temperature || 0.5,
  });
  
  console.log(`Binding ${tools.length} tools to ${baseModel.modelName} model...`);
  const model = baseModel.bindTools(tools);
  console.log(`Model binding complete. Model has tools: ${!!(model as any).bound_tools || !!(model as any).tools}`);
  
  // Combine system prompt with memory context
  const enhancedSystemPrompt = `${systemPrompt}${memoryContext}`;
  
  console.log(`Invoking model with ${tools.length} bound tools...`);
  const response = await model.invoke([
    new SystemMessage(enhancedSystemPrompt),
    ...state.messages,
  ]);
  
  console.log(`Model response received. Type: ${response.constructor.name}`);
  console.log(`Response has tool_calls: ${!!response.tool_calls}`);
  console.log(`Tool calls count: ${response.tool_calls?.length || 0}`);
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log(`Tool calls:`, response.tool_calls.map(tc => ({
      name: tc.name,
      id: tc.id,
      argsKeys: Object.keys(tc.args || {})
    })));
  }
  console.log(`Response content preview: ${typeof response.content === 'string' ? response.content.substring(0, 200) : JSON.stringify(response.content).substring(0, 200)}...`);
  
  return { messages: [response] };
}

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  console.log(`Checking if should continue. Last message type: ${lastMessage.constructor.name}`);
  console.log(`Tool calls found: ${lastMessage.tool_calls?.length || 0}`);
  
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
  const agentConfig = config.configurable as AgentConfiguration;
  const userId = config.configurable.agentId as string;
  const enabledServers = agentConfig.enabled_mcp_servers || [];
  
  console.log(`Tool node for agent ${userId}: Loading ${enabledServers.length} servers`);
  
  // Get the same tools that were used in callModel
  const { tools } = await createMcpClientAndTools(userId, enabledServers);
  
  console.log(`Tool node: Executing with ${tools.length} available tools`);
  
  // Create a standard ToolNode with the loaded tools
  const toolNode = new ToolNode(tools);
  
  // Debug the incoming state for tool execution
  const lastMessage = state.messages?.[state.messages.length - 1];
  console.log(`Tool node executing. Last message type: ${lastMessage?.constructor?.name}`);
  console.log(`Last message tool_calls:`, lastMessage?.tool_calls?.map((tc: any) => tc.name) || []);
  
  // Invoke the tool node
  console.log(`About to invoke ToolNode with ${tools.length} tools...`);
  const result = await toolNode.invoke(state, config);
  
  console.log(`ToolNode execution completed. Result messages: ${result.messages?.length || 0}`);
  if (result.messages && result.messages.length > 0) {
    result.messages.forEach((msg: any, i: number) => {
      console.log(`Result message ${i}: ${msg.constructor.name}, content preview: ${typeof msg.content === 'string' ? msg.content.substring(0, 100) : JSON.stringify(msg.content).substring(0, 100)}...`);
    });
  }
  
  return result;
}

// Define and export the graph for LangGraph Platform
const workflow = new StateGraph(MessagesAnnotation)
  .addNode("retrieveKb", retrieveKb)
  .addNode("writeMemory", writeMemory)
  .addNode("agent", callModel)
  .addNode("tools", createToolNode)
  .addNode("skipMemory", (state) => state) // Pass-through node that does nothing

  // Flow from start to Knowledge Base retrieval
  .addEdge("__start__", "retrieveKb")

  // Knowledge Base to memory analysis
  .addEdge("retrieveKb", "writeMemory")

  // Conditional path from writeMemory based on whether there's memory to update
  .addConditionalEdges("writeMemory", shouldUpdateMemory)

  // Both memory paths eventually reach agent
  .addEdge("skipMemory", "agent")

  // Tool usage cycles back to agent
  .addEdge("tools", "agent")

  // Conditional path from agent based on whether additional tools are needed
  .addConditionalEdges("agent", shouldContinue);

// ============================================================================
// LANGGRAPH PLATFORM DEPLOYMENT
// ============================================================================
// This is the ONLY graph version you need for production!
// 
// Architecture:
// 1. ONE deployed graph handles ALL agents
// 2. Agent-specific configs (model, tools, memory) passed via config.configurable
// 3. Supports long-running tasks, cron jobs, and scaling
// 4. Used by all your Next.js API routes
//
// Benefits:
// ✅ Scalable - LangGraph Platform handles infrastructure
// ✅ Persistent - Long-running tasks and workflows
// ✅ Flexible - Each agent can have different configurations
// ✅ Efficient - One deployment, multiple use cases
// ============================================================================

export const graph = workflow.compile();
