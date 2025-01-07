import { AVAILABLE_TOOLS } from './config'
import { WebBrowser } from "langchain/tools/webbrowser";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { createClient } from "@/utils/supabase/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { Tool } from "@langchain/core/tools";

interface ToolInitializationConfig {
  openAIApiKey?: string;
  modelName?: string;
  toolConfig?: Record<string, ToolConfig>;
  userId?: string; // Added to check tool connections
}

interface ToolConfig {
  maxResults?: number;
  selector?: string;
  collection?: string;
  limit?: number;
  fileTypes?: string;
  spreadsheetId?: string;
  sheetName?: string;
  timezone?: string;
  databaseUrl?: string;
  maxRows?: number;
}

interface ToolConnectionState {
  isConnected: boolean;
  error?: string;
  lastChecked: Date;
  config?: Record<string, unknown>;
}

// Initialize and verify tool connections
async function getToolConnectionStates(
  userId: string
): Promise<Record<string, ToolConnectionState>> {
  const supabase = await createClient();
  const { data: connections } = await supabase
    .from("tool_connections")
    .select("*")
    .eq("user_id", userId);

  const states: Record<string, ToolConnectionState> = {};

  for (const tool of AVAILABLE_TOOLS) {
    const connection = connections?.find((c) => c.tool_id === tool.id);
    states[tool.id] = {
      isConnected: !!connection?.is_connected,
      error: connection?.error,
      lastChecked: connection?.last_checked
        ? new Date(connection.last_checked)
        : new Date(),
      config: connection?.config,
    };
  }

  return states;
}

// Convert our tool definitions to LangChain tools
export async function initializeTools(
  toolIds: string[],
  config: ToolInitializationConfig = {}
): Promise<Tool[]> {
  const tools: Tool[] = [];

  // Get connection states if userId is provided
  const connectionStates = config.userId
    ? await getToolConnectionStates(config.userId)
    : {};

  // Always include core tools
  const coreTools = AVAILABLE_TOOLS.filter((t) => t.isCore);
  const selectedTools = [
    ...new Set([...coreTools.map((t) => t.id), ...toolIds]),
  ];

  for (const toolId of selectedTools) {
    const toolConfig = AVAILABLE_TOOLS.find((t) => t.id === toolId);
    if (!toolConfig) continue;

    // Get user-provided configuration
    const userConfig = config.toolConfig?.[toolId] || {};

    // Check connection state
    const connectionState = connectionStates[toolId];
    if (toolConfig.requiresAuth && !connectionState?.isConnected) {
      console.warn(
        `Tool ${toolId} requires authentication but is not connected`
      );
      continue;
    }

    try {
      switch (toolId) {
        case "web_search":
          if (!process.env.TAVILY_API_KEY) {
            console.warn("Tavily API key not found, skipping web search tool");
            break;
          }
          tools.push(
            new TavilySearchResults({
              apiKey: process.env.TAVILY_API_KEY,
              maxResults: userConfig.maxResults || 3,
            })
          );
          break;

        case "web_scraper": {
          const embeddings = config.openAIApiKey
            ? new OpenAIEmbeddings({ openAIApiKey: config.openAIApiKey })
            : new OpenAIEmbeddings();

          tools.push(
            new WebBrowser({
              model: new ChatOpenAI({
                modelName: config.modelName || "gpt-4o",
              }),
              embeddings,
            })
          );
          break;
        }

        case "knowledge_base":
          // Knowledge base tool implementation
          // This would integrate with your vector store/RAG system
          break;

        // Add cases for other tools...
      }
    } catch (error) {
      console.error(`Error initializing tool ${toolId}:`, error);
      if (config.userId) {
        const supabase = await createClient();
        await supabase.from("tool_connections").upsert({
          user_id: config.userId,
          tool_id: toolId,
          is_connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
          last_checked: new Date().toISOString(),
        });
      }
    }
  }

  return tools;
} 