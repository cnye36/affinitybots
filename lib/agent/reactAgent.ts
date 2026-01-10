import { ChatOpenAI } from "@langchain/openai";
import { initChatModel } from "langchain/chat_models/universal";
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
import { AssistantConfiguration } from "@/types/assistant";
import { retrieveRelevantDocuments, retrieveAllRelevantContent } from "@/lib/retrieval";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from "uuid";
import { mcpClientFactory, MCPFactoryResult } from "../mcp/mcpClientFactory";
import { rateLimiter, RateLimitError, TokenUsage } from "../rateLimiting";
import { createImageGenerationTool } from "../imageGeneration";
import { createWebSearchTool } from "../tavilySearch";
import type { EnhancedMemory, MemoryIntent, MemoryExtraction, DisplayMemory } from "@/types/memory";
import { INTENT_DETECTION_PROMPT, MEMORY_EXTRACTION_PROMPT } from "../memory/prompts";
import { formatMemoriesForPrompt, selectTopMemories, findSimilarMemory } from "../memory/formatting";

// Local fallback store for development. On LangGraph Platform, a persistent
// store is injected into config.store; we only use this if none is provided.
const fallbackStore = new InMemoryStore();

// Cache for MCP factory results to avoid recreating them on every call
const mcpFactoryCache = new Map<string, MCPFactoryResult>();

// Function to create MCP client and get tools using the new factory
async function createMcpClientAndTools(
  userId: string, 
  agentConfig: AssistantConfiguration,
  runtimeSelectedTools?: string[]
): Promise<{ client: MultiServerMCPClient | null; tools: any[] }> {
  const enabledServers = agentConfig.enabled_mcp_servers || [];
  const forceRefresh = agentConfig.force_mcp_refresh || false;
  // Include runtimeSelectedTools in cache key if provided (playground/workflow context)
  const cacheKey = `${userId}:${enabledServers.sort().join(",")}:${forceRefresh}:${runtimeSelectedTools !== undefined ? runtimeSelectedTools.sort().join(",") : "all"}`;
  
  // Check cache first (unless forcing refresh)
  if (!forceRefresh && mcpFactoryCache.has(cacheKey)) {
    const cached = mcpFactoryCache.get(cacheKey)!;
    console.log(`Using cached MCP factory result for ${userId}`);
    return { client: cached.client, tools: cached.tools };
  }
  
  // Clear cache for debugging
  mcpFactoryCache.clear();

  try {
    console.log(`createMcpClientAndTools: userId=${userId}, enabledServers=${JSON.stringify(enabledServers)}`);
    console.log(`OAuth sessions configured: ${(agentConfig.mcp_oauth_sessions || []).length}`);
    console.log(`Force refresh: ${forceRefresh}`);
    console.log(`Runtime selected tools: ${runtimeSelectedTools !== undefined ? (runtimeSelectedTools.length > 0 ? runtimeSelectedTools.join(", ") : "[] (empty)") : "undefined (all tools)"}`);

    // Check for expired sessions and refresh if needed
    const validation = await mcpClientFactory.validateAndRefresh(userId, agentConfig);
    if (validation.needsRefresh && validation.result) {
      console.log(`MCP sessions were refreshed due to expired sessions: ${validation.expiredSessions.join(", ")}`);
      // Recreate with runtimeSelectedTools if provided
      const refreshedResult = await mcpClientFactory.createForAgent(userId, agentConfig, runtimeSelectedTools);
      mcpFactoryCache.set(cacheKey, refreshedResult);
      return { client: refreshedResult.client, tools: refreshedResult.tools };
    }

    // Create new MCP clients with runtimeSelectedTools parameter
    const result = await mcpClientFactory.createForAgent(userId, agentConfig, runtimeSelectedTools);
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

// Function to detect if user wants something remembered
async function detectMemoryIntent(state: AgentState, config: LangGraphRunnableConfig) {
	const configurable =
		(config.configurable as {
			user_id?: string
			assistant_id?: string
			memory?: { enabled: boolean }
		}) || {}
	const assistantId = configurable.assistant_id
	const memoryEnabled = configurable.memory?.enabled ?? false // Default to disabled

	// Skip intent detection if memory is disabled or no assistantId
	if (!assistantId || !memoryEnabled) {
		return { messages: state.messages, should_extract_memory: false }
	}

	// We only analyze the most recent user message
	const userMessage = state.messages.at(-1)
	if (!userMessage || !(userMessage instanceof HumanMessage)) {
		return { messages: state.messages, should_extract_memory: false }
	}

	// Get user message content
	const userContent =
		typeof userMessage.content === "string"
			? userMessage.content
			: JSON.stringify(userMessage.content)

	try {
		// Use fast model for intent detection
		const intentDetector = new ChatOpenAI({
			model: "gpt-5-mini",
			streaming: false,
			temperature: 0, // Deterministic for intent detection
		})

		const intentPrompt = [
			new SystemMessage(INTENT_DETECTION_PROMPT),
			new HumanMessage(userContent),
		]

		const response = await intentDetector.invoke(intentPrompt)
		const intentResult: MemoryIntent = JSON.parse(response.content as string)

		console.log("[Memory] Intent detection result:", intentResult)

		if (intentResult.should_remember) {
			return { messages: state.messages, should_extract_memory: true }
		}
	} catch (error) {
		console.error("Error detecting memory intent:", error)
	}

	return { messages: state.messages, should_extract_memory: false }
}

// Function to extract and write user memories (enhanced version)
async function writeMemory(state: AgentState, config: LangGraphRunnableConfig) {
	const configurable =
		(config.configurable as {
			user_id?: string
			assistant_id?: string
			memory?: { enabled: boolean }
		}) || {}
	const assistantId = configurable.assistant_id
	const memoryEnabled = configurable.memory?.enabled ?? false

	// Skip if memory disabled or no assistantId
	if (!assistantId || !memoryEnabled) {
		return { messages: state.messages }
	}

	// Get the most recent user message
	const userMessage = state.messages.at(-1)
	if (!userMessage || !(userMessage instanceof HumanMessage)) {
		return { messages: state.messages }
	}

	const userContent =
		typeof userMessage.content === "string"
			? userMessage.content
			: JSON.stringify(userMessage.content)

	try {
		const kvStore = (config as any).store ?? fallbackStore
		const namespace = ["user_profile", assistantId]

		// Use enhanced extraction with rich semantic content
		const memoryExtractor = new ChatOpenAI({
			model: "gpt-5-mini",
			streaming: false,
			temperature: 0,
		})

		const extractionPrompt = [
			new SystemMessage(MEMORY_EXTRACTION_PROMPT),
			new HumanMessage(userContent),
		]

		const response = await memoryExtractor.invoke(extractionPrompt)
		const extraction: MemoryExtraction = JSON.parse(response.content as string)

		console.log("[Memory] Extracted memory:", extraction)

		// Check for similar existing memories (deduplication)
		const existingMemories = await kvStore.search(namespace, { filter: {} })
		const displayMemories: DisplayMemory[] = existingMemories.map((m: any) => ({
			id: m.key,
			...m.value,
		}))

		const enhancedMemory: EnhancedMemory = {
			title: extraction.title,
			category: extraction.category,
			content: extraction.content,
			key_facts: extraction.key_facts,
			importance: extraction.importance,
			context: extraction.context,
			extracted_at: new Date().toISOString(),
			source_message: userContent,
			intent_confidence: "high", // From intent detection
		}

		// Check if this is an update to an existing memory
		const similarMemoryKey = await findSimilarMemory(enhancedMemory, displayMemories)

		if (similarMemoryKey) {
			// Update existing memory
			console.log(`[Memory] Updating existing memory: ${similarMemoryKey}`)
			enhancedMemory.updated_at = new Date().toISOString()
			await kvStore.put(namespace, similarMemoryKey, enhancedMemory)
		} else {
			// Create new memory with chronological key
			const timestamp = Date.now()
			const uuid = uuidv4().split("-")[0] // Short UUID
			const memoryKey = `mem_${timestamp}_${uuid}`
			console.log(`[Memory] Creating new memory: ${memoryKey}`)
			await kvStore.put(namespace, memoryKey, enhancedMemory)
		}

		console.log(`[Memory] Successfully saved: "${extraction.title}"`)

		// Add a special AI message to notify that memory was saved
		const memoryNotification = new AIMessage({
			content: `[MEMORY_SAVED]${JSON.stringify(enhancedMemory)}`,
			additional_kwargs: {
				memory_saved: true,
				memory_data: enhancedMemory,
			},
		})

		return {
			messages: [...state.messages, memoryNotification],
		}
	} catch (error) {
		console.error("[Memory] Error extracting or storing memory:", error)
		return { messages: state.messages }
	}
}

// Function to determine if memory intent was detected
function shouldExtractMemory(state: typeof MessagesAnnotation.State) {
	interface StateWithIntentFlag {
		messages: Array<BaseMessage>
		should_extract_memory?: boolean
	}
	const stateWithIntent = state as StateWithIntentFlag
	return stateWithIntent.should_extract_memory === true ? "writeMemory" : "agent"
}

// Function to retrieve user memories (with smart limiting)
async function retrieveMemories(
	assistantId: string | undefined,
	memoryEnabled: boolean = false,
	config?: LangGraphRunnableConfig
): Promise<DisplayMemory[]> {
	if (!assistantId || !memoryEnabled) {
		return []
	}

	const namespace = ["user_profile", assistantId]
	try {
		const kvStore = (config as any)?.store ?? fallbackStore
		const rawMemories = await kvStore.search(namespace, { filter: {} })

		// Convert to DisplayMemory format
		const memories: DisplayMemory[] = rawMemories.map((m: any) => ({
			id: m.key,
			...m.value,
			created_at: m.created_at,
		}))

		// Apply smart limiting - top 20 most important + recent
		const topMemories = selectTopMemories(memories, 20)

		console.log(`[Memory] Retrieved ${memories.length} total memories, using top ${topMemories.length} for context`)

		return topMemories
	} catch (error) {
		console.error("[Memory] Error retrieving memories:", error)
		return []
	}
}

export async function retrieveKb(state: AgentState, config: RunnableConfig) {
  const configurable = (config.configurable as { 
    user_id?: string; 
    thread_id?: string;
    assistant_id?: string;
  }) || {};
  const { user_id, thread_id, assistant_id } = configurable;
  
  // Use assistant_id as the primary identifier for knowledge base retrieval
  const effectiveAssistantId = assistant_id;

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
    effectiveAssistantId,
    thread_id,
    8 // topK
  );

  // Debug logging
  console.log(`[retrieveKb] Query: "${lastUserMsgContent}"`);
  console.log(`[retrieveKb] UserId: ${user_id}, AssistantId: ${effectiveAssistantId}, ThreadId: ${thread_id}`);
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

/**
 * GLOBAL SYSTEM PROMPT - Immutable prompt applied to ALL agents
 * This prompt is not visible to users and cannot be modified.
 * It provides core operating instructions for all agents in the AffinityBots ecosystem.
 */
export const GLOBAL_SYSTEM_PROMPT = `You are a highly capable AI agent operating within the AffinityBots ecosystem.

# GLOBAL OPERATING INSTRUCTIONS
1. **Tool Usage Philosophy:**
   - You have access to a suite of tools (Web Search, Image Generation, etc.).
   - **DO NOT** ask for permission to use tools for read-only or creative tasks (searching, analyzing, generating images). Just use them.
   - **DO NOT** explain your tool selection logic (e.g., "I will now search the web because...") unless the user specifically asks or the task is complex. Just perform the action and present the results.
   - If a specific tool is disabled (e.g., Web Search is toggled off), rely strictly on your internal knowledge base without complaint.

2. **Image Generation & Search:**
   - **Images:** If the user request implies a visual output (e.g., "design a logo," "imagine a scene"), use the Image Generation tool immediately.
   - **Search:** If the query requires current events, fact-checking, or specific data after your training cutoff, use Web Search immediately.

3. **Safety & Guardrails:**
   - Refuse to generate hate speech, sexual violence, or instructions for illegal acts.
   - If a request violates safety policies, politely decline only the specific violative part and fulfill the rest of the request if possible.

4. **Interaction Style:**
   - Be direct. Avoid "As an AI..." preambles.
   - Adopt the persona defined in your specific SYSTEM INSTRUCTIONS below.
   - If no specific tool is required, answer using your internal reasoning.

5. **Context Priority:**
   - **ALWAYS check provided context FIRST** - If information is available in your knowledge base or thread attachments, use that content directly
   - **For uploaded files/documents** - The content will be provided in your context. DO NOT use web search tools to access files that users have uploaded
   - **For uploaded images** - Image metadata and descriptions will be provided. You can analyze this information and ask users for more specific details about what they see
   - **Only use tools when** the information is NOT available in your provided context

IMPORTANT HIERARCHY:
- **FIRST**: Use provided knowledge base and thread attachment content 
- **SECOND**: Use your general knowledge
- **LAST**: Use tools only when information is missing from context

MULTIMODAL CAPABILITIES:
- **Documents**: Full text content is extracted and provided
- **Images**: Metadata and basic analysis is provided - ask users to describe visual content for deeper analysis
- **Files**: All uploaded content is processed and made available in your context

When analyzing uploaded documents, images, or files, their content will be directly provided to you in the context - there is no need to search for or fetch these files using tools.`;

/**
 * Legacy default prompt for backward compatibility
 * @deprecated Use GLOBAL_SYSTEM_PROMPT instead
 */
const DEFAULT_SYSTEM_PROMPT = GLOBAL_SYSTEM_PROMPT;

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
  
  // Get configuration from configurable object
  const configurable = config.configurable as AssistantConfiguration & {
    user_id?: string;
    thread_id?: string;
    assistant_id?: string;
  } || {};
  
  // Use metadata.user_id first, then configurable.user_id, then configurable.assistant_id as fallback
  const userId = (config.metadata?.user_id as string) || 
                 configurable.user_id || 
                 configurable.assistant_id;
  
  const assistantId = configurable.assistant_id;
  
  console.log(`🔍 Assistant execution - metadata user_id: ${config.metadata?.user_id}, configurable user_id: ${configurable.user_id}, assistant_id: ${configurable.assistant_id}, using userId: ${userId}, assistantId: ${assistantId}`);
  
  // Rate limiting check
  if (userId) {
    try {
      // Estimate tokens from the current conversation
      const estimatedInputTokens = state.messages.reduce((total, msg) => {
        const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
        return total + Math.ceil(content.length / 4); // Rough estimate: 1 token ≈ 4 characters
      }, 0);
      
      // Estimate output tokens (assume response will be similar length to input)
      const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.8);
      
      const rateLimitResult = await rateLimiter.checkRateLimit(userId, estimatedInputTokens, estimatedOutputTokens);
      
      if (!rateLimitResult.allowed) {
        const errorMessage = `Rate limit exceeded. Your limit resets at ${new Date(rateLimitResult.resetTime).toISOString()}.`;
        
        console.log(`🚫 Rate limit exceeded for user ${userId}: ${errorMessage}`);
        
        // Return an error message instead of throwing
        return {
          messages: [
            new AIMessage({
              content: errorMessage,
              additional_kwargs: {
                rate_limit_exceeded: true,
                remaining_budget: rateLimitResult.remainingBudget,
                reset_time: rateLimitResult.resetTime,
                daily_usage: rateLimitResult.dailyUsage,
              },
            }),
          ],
        };
      }
      
      console.log(`✅ Rate limit check passed for user ${userId}. Remaining budget: $${rateLimitResult.remainingBudget.toFixed(2)}`);
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue execution if rate limiting fails
    }
  }
  
  // Agent-specific prompt (created by the Architect, visible to users)
  const agentSpecificPrompt = configurable.prompt_template || "";
  const memoryEnabled = configurable.memory?.enabled ?? false;

  // Retrieve user memories (top 20 by importance + recency)
  const memories = await retrieveMemories(assistantId, memoryEnabled, config);

  // Format memories for inclusion in the prompt (rich, categorized context)
  const memoryContext = formatMemoriesForPrompt(memories);
  
  // Combine global immutable prompt with agent-specific prompt
  // The global prompt provides core operating instructions
  // The agent-specific prompt defines the agent's personality and role
  const systemPrompt = agentSpecificPrompt
    ? `${GLOBAL_SYSTEM_PROMPT}\n\n---\n\n# SYSTEM INSTRUCTIONS\n\n${agentSpecificPrompt}`
    : GLOBAL_SYSTEM_PROMPT;

  // Always attempt to load MCP tools. If none explicitly enabled, the factory
  // will fall back to all available servers for the user.
  // Only use selected_tools if we're in playground/workflow context (not agent chat)
  // Agent chat should always have all tools from enabled servers
  const isPlaygroundContext = !!(configurable as any).playground_session_id;
  const isWorkflowContext = !!(config.metadata?.workflow_id || config.metadata?.workflow_task_id);
  // Only extract runtimeSelectedTools if we're in playground/workflow context
  // In agent chat context, ignore selected_tools from stored agent config
  const runtimeSelectedTools = (isPlaygroundContext || isWorkflowContext)
    ? ((configurable as any).selected_tools as string[] | undefined)
    : undefined;
  
  console.log(`🔍 Context detection: playground=${isPlaygroundContext}, workflow=${isWorkflowContext}, runtimeSelectedTools=${runtimeSelectedTools !== undefined ? (runtimeSelectedTools.length > 0 ? runtimeSelectedTools.join(", ") : "[] (empty)") : "undefined (all tools)"}`);
  console.log(`📋 Configurable selected_tools: ${(configurable as any).selected_tools ? JSON.stringify((configurable as any).selected_tools) : "not set"}`);
  
  let tools: any[] = [];
  const enabledServersForRun = configurable.enabled_mcp_servers || [];
  let result = await createMcpClientAndTools(userId || assistantId || "default", configurable, runtimeSelectedTools);
  tools = result.tools;
  if (tools.length === 0) {
    const contextMsg = enabledServersForRun.length > 0
      ? `for enabled servers (${enabledServersForRun.join(", ")})`
      : "from available servers";
    console.log(`No tools loaded ${contextMsg}. Forcing refresh once...`);
    const refreshed = await createMcpClientAndTools(userId || assistantId || "default", {
      ...configurable,
      force_mcp_refresh: true,
    } as any, runtimeSelectedTools);
    tools = refreshed.tools;
  }
  
  // Add built-in image generation tool to all agents
  // This enables agents to generate images using DALL-E 3
  try {
    const imageTool = createImageGenerationTool({ ownerId: userId || assistantId || "unknown" });
    if (!tools.some((t) => t?.name === "generate_image")) {
      tools.push(imageTool);
    }
    console.log("Added built-in image generation tool", {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    });
  } catch (error) {
    console.error("Failed to add image generation tool:", error);
    // Continue without image generation if there's an error
  }

  // Add web search tool if enabled via config
  // This is controlled by the frontend toggle in the composer
  console.log("🌐 Web Search Tool Check:", {
    enabled: configurable.web_search_enabled,
    hasTavilyKey: !!process.env.TAVILY_API_KEY,
  });

  if (configurable.web_search_enabled === true) {
    try {
      const webSearchTool = createWebSearchTool();
      if (!tools.some((t) => t?.name === "web_search")) {
        tools.push(webSearchTool);
      }
      console.log("✅ Added built-in web search tool to agent");
    } catch (error) {
      console.error("❌ Failed to add web search tool:", error);
      // Continue without web search if there's an error
    }
  } else {
    console.log("⏭️  Web search tool NOT added (toggle is disabled)");
  }

  console.log(`Assistant ${userId || assistantId}: Binding ${tools.length} tools to model`);
  console.log(`Enabled servers: ${enabledServersForRun.join(", ") || "none"}`);
  
  // Create a model and give it access to the tools
  // Prefer universal init when `llm` is provided; fallback to OpenAI
  let baseModel: any;
  if (configurable.llm) {
    const llmId = String(configurable.llm);
    const hasProviderPrefix = llmId.includes(":");
    let [modelProvider, providerModel] = hasProviderPrefix ? llmId.split(":", 2) : [undefined, llmId];
    // Normalize provider names and infer when omitted
    if (modelProvider === "google") modelProvider = "google-genai" as any;
    if (!modelProvider) {
      if (providerModel?.startsWith("gemini")) modelProvider = "google-genai" as any;
    }
    // Determine if target model is an OpenAI GPT-5 family model
    const isGpt5 = /(^|:)gpt-5(?![a-zA-Z0-9-])/.test(providerModel || "") || /(^|:)gpt-5(?![a-zA-Z0-9-])/.test(String(modelProvider || ""));

    // Build params conditionally: GPT-5 rejects temperature and expects reasoningEffort
    const universalParams: Record<string, any> = {
      modelProvider: modelProvider as any,
      streaming: true, 
    };
    if (isGpt5) {
      universalParams.reasoningEffort = configurable.reasoningEffort ?? "medium";
    } else {
      universalParams.temperature = (typeof configurable.temperature === 'number' ? configurable.temperature : 0.3);
      if (configurable.reasoningEffort) universalParams.reasoningEffort = configurable.reasoningEffort;
    }

    baseModel = await initChatModel(providerModel, universalParams);
  } else {
    // ChatOpenAI direct path. Respect GPT-5 parameter constraints too.
    const targetModel = configurable.model || "gpt-5";
    const isGpt5 = /^gpt-5(?![a-zA-Z0-9-])/.test(targetModel);

    const openAiParams: Record<string, any> = {
      model: targetModel,
      streaming: true,
    };
    if (isGpt5) {
      openAiParams.reasoningEffort = configurable.reasoningEffort ?? "medium";
      // Do NOT set temperature for GPT-5
    } else {
      openAiParams.temperature = (typeof configurable.temperature === 'number' ? configurable.temperature : 0.3);
      if (configurable.reasoningEffort) openAiParams.reasoningEffort = configurable.reasoningEffort;
    }

    baseModel = new ChatOpenAI(openAiParams as any);
  }
  
  console.log(`Binding ${tools.length} tools to model...`);
  const model = baseModel.bindTools(tools);
  console.log(`Model binding complete. Model has tools: ${!!(model as any).bound_tools || !!(model as any).tools}`);
  
  // Combine system prompt with memory context and any additional system messages
  // Some providers (Anthropic, Gemini) only allow ONE system message and it must be first.
  // We therefore merge any prior System messages (e.g., from knowledge retrieval) into the first one.
  const additionalSystemText = state.messages
    .filter((m: any) => m instanceof SystemMessage || (typeof (m as any).type === 'string' && (m as any).type === 'system'))
    .map((m: any) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
    .join("\n\n");

  const enhancedSystemPrompt = `${systemPrompt}${memoryContext}${additionalSystemText ? `\n\n${additionalSystemText}` : ''}`;

  // Filter out any system messages to satisfy providers that only allow the first to be system
  const nonSystemMessages = state.messages.filter(
    (m: any) => !(m instanceof SystemMessage) && !((typeof (m as any).type === 'string') && (m as any).type === 'system')
  );
  
  console.log(`Invoking model with ${tools.length} bound tools...`);
  const response = await model.invoke([
    new SystemMessage(enhancedSystemPrompt),
    ...nonSystemMessages,
  ]);
  
  console.log(`Model response received. Type: ${response.constructor.name}`);
  console.log(`Response has tool_calls: ${!!response.tool_calls}`);
  console.log(`Tool calls count: ${response.tool_calls?.length || 0}`);
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log(`Tool calls:`, response.tool_calls.map((tc: any) => ({
      name: tc.name,
      id: tc.id,
      argsKeys: Object.keys(tc.args || {})
    })));
  }
  console.log(`Response content preview: ${typeof response.content === 'string' ? response.content.substring(0, 200) : JSON.stringify(response.content).substring(0, 200)}...`);
  
  // Log full response structure to debug reasoning tokens
  console.log(`[REACT AGENT] Full model response structure:`, {
    responseType: response.constructor.name,
    allKeys: Object.keys(response),
    hasReasoningContent: !!(response as any).reasoning_content,
    hasResponseMetadata: !!(response as any).response_metadata,
    responseMetadataKeys: (response as any).response_metadata ? Object.keys((response as any).response_metadata) : [],
    responseMetadata: (response as any).response_metadata ? JSON.stringify((response as any).response_metadata, null, 2) : null,
    additionalKwargsKeys: (response as any).additional_kwargs ? Object.keys((response as any).additional_kwargs) : [],
    additionalKwargs: (response as any).additional_kwargs ? JSON.stringify((response as any).additional_kwargs, null, 2) : null,
    fullResponse: JSON.stringify(response, null, 2),
  });

  // If the model is about to call tools, suppress any "pre-tool" natural language.
  // We want the tool result (e.g., inline generated image) to appear directly under the user's message.
  if (response.tool_calls?.length) {
    try {
      (response as any).content = "";
    } catch {
      // best-effort
    }
  }
  
  // Record usage after successful model invocation
  if (userId && !response.additional_kwargs?.rate_limit_exceeded) {
    try {
      // Prefer provider-reported usage if available
      const usageMeta: any = (response as any).usage_metadata ||
        (response as any).response_metadata?.token_usage ||
        (response as any).response_metadata?.usage ||
        (response as any).response_metadata ||
        (response as any).additional_kwargs?.token_usage ||
        (response as any).additional_kwargs?.usage ||
        null;

      let actualInputTokens = 0;
      let actualOutputTokens = 0;

      if (usageMeta) {
        // Anthropic style: { input_tokens, output_tokens }
        // OpenAI style: { prompt_tokens, completion_tokens }
        // Gemini often uses { input, output } or nested under token_usage
        const tokenUsage = usageMeta.token_usage || usageMeta;
        actualInputTokens =
          tokenUsage.input_tokens ?? tokenUsage.prompt_tokens ?? tokenUsage.total_input_tokens ?? tokenUsage.input ?? 0;
        actualOutputTokens =
          tokenUsage.output_tokens ?? tokenUsage.completion_tokens ?? tokenUsage.total_output_tokens ?? tokenUsage.output ?? 0;
      }

      // Fallback to rough estimation (1 token ≈ 4 characters)
      if (!actualInputTokens || !actualOutputTokens) {
        const inputContent = [
          enhancedSystemPrompt,
          ...state.messages.map(msg => {
            const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
            return content;
          })
        ].join('\n');
        const outputContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
        actualInputTokens = actualInputTokens || Math.ceil(inputContent.length / 4);
        actualOutputTokens = actualOutputTokens || Math.ceil(outputContent.length / 4);
      }

      const usage: TokenUsage = {
        userId,
        inputTokens: actualInputTokens,
        outputTokens: actualOutputTokens,
        timestamp: Date.now(),
        model: (configurable.llm || configurable.model || "gpt-5") as string,
        sessionId: configurable.thread_id,
      };
      await rateLimiter.recordUsage(usage);
      console.log(`📊 Usage recorded for user ${userId}: ${actualInputTokens} input tokens, ${actualOutputTokens} output tokens`);
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }
  
  return { messages: [response] };
}

// Define the function that determines whether to continue or not
function shouldContinue({ messages }: typeof MessagesAnnotation.State) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  console.log(`Checking if should continue. Last message type: ${lastMessage.constructor.name}`);
  console.log(`Tool calls found: ${lastMessage.tool_calls?.length || 0}`);
  
  
  if (lastMessage.tool_calls?.length) {
    console.log(`Routing to tools node. Tool calls:`, lastMessage.tool_calls.map(tc => tc.name));
    return "tools";
  }
  console.log("No tool calls found, ending conversation");
  return "__end__";
}

function shouldContinueAfterTools({ messages }: typeof MessagesAnnotation.State) {
  // If the last tool call was `generate_image`, end immediately so the UI shows
  // the tool result directly under the user message (no extra assistant chatter).
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg: any = messages[i];
    const toolCalls = msg?.tool_calls;
    if (Array.isArray(toolCalls) && toolCalls.length > 0) {
      const names = toolCalls.map((tc: any) => tc?.name).filter(Boolean);
      if (names.includes("generate_image")) return "__end__";
      return "agent";
    }
  }
  return "agent";
}

// Create a dynamic tool node that loads tools at runtime
async function createToolNode(state: any, config: any): Promise<any> {
  const configurable = config.configurable as AssistantConfiguration & {
    user_id?: string;
    assistant_id?: string;
  };
  
  // Use the same user ID logic as callModel to ensure consistent tool loading
  const userId = (config.metadata?.user_id as string) || 
                 configurable.user_id || 
                 configurable.assistant_id;
  
  const assistantId = configurable.assistant_id;
  const enabledServers = configurable.enabled_mcp_servers || [];
  // Only use selected_tools if we're in playground/workflow context (not agent chat)
  const isPlaygroundContext = !!(configurable as any).playground_session_id;
  const isWorkflowContext = !!(config.metadata?.workflow_id || config.metadata?.workflow_task_id);
  // Only extract runtimeSelectedTools if we're in playground/workflow context
  // In agent chat context, ignore selected_tools from stored agent config
  const runtimeSelectedTools = (isPlaygroundContext || isWorkflowContext)
    ? ((configurable as any).selected_tools as string[] | undefined)
    : undefined;
  
  console.log(`🔍 Tool node execution - metadata user_id: ${config.metadata?.user_id}, configurable user_id: ${configurable.user_id}, assistant_id: ${configurable.assistant_id}, using userId: ${userId}, assistantId: ${assistantId}`);
  console.log(`Tool node for assistant ${userId || assistantId}: Loading ${enabledServers.length} servers`);
  console.log(`Tool node context: playground=${isPlaygroundContext}, workflow=${isWorkflowContext}, runtimeSelectedTools=${runtimeSelectedTools !== undefined ? (runtimeSelectedTools.length > 0 ? runtimeSelectedTools.join(", ") : "[] (empty)") : "undefined (all tools)"}`);
  
  // Get the same tools that were used in callModel (use real userId for consistency)
  let { tools } = await createMcpClientAndTools(userId || assistantId || "default", configurable, runtimeSelectedTools);
  if ((configurable.enabled_mcp_servers?.length || 0) > 0 && tools.length === 0) {
    console.log(`Tool node: no tools for enabled servers. Forcing refresh once...`);
    const refreshed = await createMcpClientAndTools(userId || assistantId || "default", {
      ...configurable,
      force_mcp_refresh: true,
    } as any, runtimeSelectedTools);
    tools = refreshed.tools;
  }
  
  // Add built-in image generation tool (same as in callModel)
  try {
    const imageTool = createImageGenerationTool({ ownerId: userId || assistantId || "unknown" });
    // Check if tool already exists to avoid duplicates
    if (!tools.some(t => t.name === "generate_image")) {
      tools.push(imageTool);
    }
  } catch (error) {
    console.error("Failed to add image generation tool in tool node:", error);
  }
  
  console.log(`Tool node for assistant ${userId || assistantId}: Executing with ${tools.length} available tools`);
  console.log(`Enabled servers for tool node: ${enabledServers.join(", ")}`);
  console.log(`OAuth sessions active: ${(configurable.mcp_oauth_sessions || []).length}`);
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
      
      // Only use selected_tools if we're in playground/workflow context (not agent chat)
      const isPlaygroundContext = !!(configurable as any).playground_session_id;
      const isWorkflowContext = !!(config.metadata?.workflow_id || config.metadata?.workflow_task_id);
      // Only extract runtimeSelectedTools if we're in playground/workflow context
      const runtimeSelectedTools = (isPlaygroundContext || isWorkflowContext)
        ? ((configurable as any).selected_tools as string[] | undefined)
        : undefined;
      
      // Force refresh the MCP client
        const { tools: freshTools } = await createMcpClientAndTools(userId || assistantId || "default", {
          ...configurable,
          force_mcp_refresh: true
        }, runtimeSelectedTools);
      
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
	.addNode("detectIntent", detectMemoryIntent)
	.addNode("writeMemory", writeMemory)
	.addNode("agent", callModel)
	.addNode("tools", createToolNode)

	// Flow from start to Knowledge Base retrieval
	.addEdge("__start__", "retrieveKb")

	// Knowledge Base to intent detection
	.addEdge("retrieveKb", "detectIntent")

	// Conditional path from detectIntent - extract memory or skip to agent
	.addConditionalEdges("detectIntent", shouldExtractMemory)

	// After memory extraction, go to agent
	.addEdge("writeMemory", "agent")

	// Tools normally cycle back to agent, but end immediately after image generation
	.addConditionalEdges("tools", shouldContinueAfterTools)

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

export const graph = workflow.compile({
  // Always use fallbackStore in local development; LangGraph Platform injects its own store
  store: fallbackStore,
  // Interrupt before tool execution for human-in-the-loop approval
  interruptBefore: ["tools"],
});
