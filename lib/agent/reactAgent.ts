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
import { retrieveRelevantDocuments, retrieveAllRelevantContent } from "@/lib/retrieval";
import fs from "fs";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from "uuid";
import { mcpClientFactory, MCPFactoryResult } from "../mcp/mcpClientFactory";

// Initialize the memory store
export const store = new InMemoryStore();

// Cache for MCP factory results to avoid recreating them on every call
const mcpFactoryCache = new Map<string, MCPFactoryResult>();

// Function to create MCP client and get tools using the new factory
async function createMcpClientAndTools(userId: string, agentConfig: AgentConfiguration): Promise<{ client: MultiServerMCPClient | null; tools: any[] }> {
  const enabledServers = agentConfig.enabled_mcp_servers || [];
  const forceRefresh = agentConfig.force_mcp_refresh || false;
  const cacheKey = `${userId}:${enabledServers.sort().join(",")}:${forceRefresh}`;
  
  // Check cache first (unless forcing refresh)
  if (!forceRefresh && mcpFactoryCache.has(cacheKey)) {
    const cached = mcpFactoryCache.get(cacheKey)!;
    console.log(`Using cached MCP factory result for ${userId}`);
    return { client: cached.client, tools: cached.tools };
  }

  try {
    console.log(`createMcpClientAndTools: userId=${userId}, enabledServers=${JSON.stringify(enabledServers)}`);
    console.log(`OAuth sessions configured: ${(agentConfig.mcp_oauth_sessions || []).length}`);
    console.log(`Force refresh: ${forceRefresh}`);

    // Check for expired sessions and refresh if needed
    const validation = await mcpClientFactory.validateAndRefresh(userId, agentConfig);
    if (validation.needsRefresh && validation.result) {
      console.log(`MCP sessions were refreshed due to expired sessions: ${validation.expiredSessions.join(", ")}`);
      const result = validation.result;
      mcpFactoryCache.set(cacheKey, result);
      return { client: result.client, tools: result.tools };
    }

    // Create new MCP clients
    const result = await mcpClientFactory.createForAgent(userId, agentConfig);
    mcpFactoryCache.set(cacheKey, result);
    
    console.log(`Loaded ${result.tools.length} tools from ${result.serverCount} MCP servers`);
    console.log(`OAuth sessions active: ${result.oauthSessions.size}`);
    if (result.tools.length > 0) {
      console.log(`Tool names: ${result.tools.map(t => t.name).join(", ")}`);
      console.log(`Tool details:`, result.tools.map(t => ({
        name: t.name,
        description: t.description,
        schema: t.schema || 'No schema',
        hasInvoke: typeof t.invoke === 'function',
        constructor: t.constructor?.name
      })));
    }
    
    return { client: result.client, tools: result.tools };
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
  const configurable = (config.configurable as { agentId?: string; threadId?: string }) || {};
  const { agentId, threadId } = configurable;

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

  // Use service role client for LangGraph Studio (no cookies needed)
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  // Get both knowledgebase documents AND thread attachments
  const allContent = await retrieveAllRelevantContent(
    lastUserMsgContent,
    supabase,
    agentId,
    threadId,
    8 // topK
  );

  // Debug logging
  console.log(`[retrieveKb] Query: "${lastUserMsgContent}"`);
  console.log(`[retrieveKb] AgentId: ${agentId}, ThreadId: ${threadId}`);
  console.log(`[retrieveKb] Found ${allContent.knowledgebase.length} knowledgebase docs`);
  console.log(`[retrieveKb] Found ${allContent.threadAttachments.length} thread attachments`);
  if (allContent.threadAttachments.length > 0) {
    console.log('[retrieveKb] Attachment details:', allContent.threadAttachments.map(a => ({
      fileName: a.metadata.file_name,
      type: a.metadata.attachment_type,
      contentLength: a.pageContent?.length || 0
    })));
  }

  const systemMessages = [];
  
  // Add knowledgebase context if available
  if (allContent.knowledgebase.length > 0) {
    systemMessages.push({
      type: "system",
      content:
        "You have access to the following information from your long-term knowledge base (available across all conversations):\n\n" +
        allContent.knowledgebase
          .map(
            (d, i) =>
              `Knowledge Source ${i + 1} (from file: ${
                d.metadata.filename || "unknown"
              }):\n"""\n${d.pageContent}\n"""`
          )
          .join("\n\n---\n\n") +
        "\n\n",
    });
  }

  // Add thread attachment context if available
  if (allContent.threadAttachments.length > 0) {
    systemMessages.push({
      type: "system",
      content:
        "🔥 UPLOADED FILES IN THIS CONVERSATION - CONTENT PROVIDED BELOW:\n\n" +
        "The user has uploaded files to this conversation. Their content is extracted and provided here for your analysis. DO NOT use external tools to access these files - the content is available below:\n\n" +
        allContent.threadAttachments
          .map(
            (d, i) =>
              `📎 UPLOADED FILE ${i + 1}: "${d.metadata.file_name || "unknown"}" (${d.metadata.attachment_type})\n` +
              `EXTRACTED CONTENT:\n"""\n${d.pageContent}\n"""`
          )
          .join("\n\n---\n\n") +
        "\n\n✅ All uploaded file content is provided above. Use this content directly to answer questions about the uploaded files.",
    });
  }

  return {
    messages: systemMessages,
  };
}

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant with access to provided context and tools.

CONTEXT PRIORITY RULES:
1. **ALWAYS check provided context FIRST** - If information is available in your knowledge base or thread attachments, use that content directly
2. **For uploaded files/documents** - The content will be provided in your context. DO NOT use web search tools to access files that users have uploaded
3. **For uploaded images** - Image metadata and descriptions will be provided. You can analyze this information and ask users for more specific details about what they see
4. **Only use tools when** the information is NOT available in your provided context

IMPORTANT HIERARCHY:
- **FIRST**: Use provided knowledge base and thread attachment content 
- **SECOND**: Use your general knowledge
- **LAST**: Use tools only when information is missing from context

MULTIMODAL CAPABILITIES:
- **Documents**: Full text content is extracted and provided
- **Images**: Metadata and basic analysis is provided - ask users to describe visual content for deeper analysis
- **Files**: All uploaded content is processed and made available in your context

When analyzing uploaded documents, images, or files, their content will be directly provided to you in the context - there is no need to search for or fetch these files using tools.`;

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
  // Use the actual user ID from metadata, fallback to agentId if not available
  const userId = (config.metadata?.user_id as string) || (config.configurable.agentId as string);
  console.log(`🔍 Agent execution - metadata user_id: ${config.metadata?.user_id}, agentId: ${config.configurable.agentId}, using userId: ${userId}`);
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

  // Load MCP tools using the new factory
  const { tools } = await createMcpClientAndTools(userId, agentConfig);
  
  console.log(`Agent ${userId}: Binding ${tools.length} tools to model`);
  console.log(`Enabled servers: ${agentConfig.enabled_mcp_servers?.join(", ") || "none"}`);
  
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
  // Use the same user ID logic as callModel to ensure consistent tool loading
  const userId = (config.metadata?.user_id as string) || (config.configurable.agentId as string);
  const enabledServers = agentConfig.enabled_mcp_servers || [];
  
  console.log(`🔍 Tool node execution - metadata user_id: ${config.metadata?.user_id}, agentId: ${config.configurable.agentId}, using userId: ${userId}`);
  console.log(`Tool node for agent ${userId}: Loading ${enabledServers.length} servers`);
  
  // Get the same tools that were used in callModel
  const { tools } = await createMcpClientAndTools(userId, agentConfig);
  
  console.log(`Tool node for agent ${userId}: Executing with ${tools.length} available tools`);
  console.log(`Enabled servers for tool node: ${enabledServers.join(", ")}`);
  console.log(`OAuth sessions active: ${(agentConfig.mcp_oauth_sessions || []).length}`);
  if (tools.length > 0) {
    console.log(`Available tool names: ${tools.map(t => t.name).join(", ")}`);
  }
  
  // Create a standard ToolNode with the loaded tools
  const toolNode = new ToolNode(tools);
  
  // Debug the incoming state for tool execution
  const lastMessage = state.messages?.[state.messages.length - 1];
  const toolCalls = lastMessage?.tool_calls || [];
  console.log(`Tool node executing. Tool calls requested: ${toolCalls.length}`);
  if (toolCalls.length > 0) {
    console.log(`Requested tools:`, toolCalls.map((tc: any) => `${tc.name}(${Object.keys(tc.args || {}).join(", ")})`));
  }
  
  // Invoke the tool node
  console.log(`About to invoke ToolNode with ${tools.length} tools...`);
  let result = await toolNode.invoke(state, config);
  
  // Check for session expiration errors and retry once with fresh client
  if (result.messages && result.messages.length > 0) {
    const hasSessionError = result.messages.some((msg: any) => {
      const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      return content.includes('Session not found') || 
             content.includes('expired') || 
             content.includes('Transport is closed');
    });
    
    if (hasSessionError) {
      console.log(`🔄 Session expired detected, refreshing MCP client and retrying...`);
      
      // Force refresh the MCP client
      const { tools: freshTools } = await createMcpClientAndTools(userId, {
        ...agentConfig,
        force_mcp_refresh: true
      });
      
      if (freshTools.length > 0) {
        console.log(`✅ Refreshed MCP client with ${freshTools.length} tools, retrying tool calls...`);
        const freshToolNode = new ToolNode(freshTools);
        result = await freshToolNode.invoke(state, config);
        console.log(`🔄 Retry completed with ${result.messages?.length || 0} result messages`);
      }
    }
  }
  
  console.log(`ToolNode execution completed. Result messages: ${result.messages?.length || 0}`);
  if (result.messages && result.messages.length > 0) {
    result.messages.forEach((msg: any, i: number) => {
      const contentPreview = typeof msg.content === 'string' ? msg.content.substring(0, 200) : JSON.stringify(msg.content).substring(0, 200);
      console.log(`Result message ${i}: ${msg.constructor.name}, content: ${contentPreview}...`);
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
