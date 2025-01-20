import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { Tool } from "@langchain/core/tools";
import { createClient } from "@/utils/supabase/server";
import { Calculator } from "@langchain/community/tools/calculator";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";

interface ToolConfig {
  maxResults?: number;
  isEnabled?: boolean;
  apiKey?: string;
}

// Initialize and verify tool connection state
async function getToolConnectionState(
  userId: string,
  toolId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("tool_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("tool_id", toolId)
    .single();

  return !!connection?.is_connected;
}

// Convert our tool definition to LangChain tool
export async function initializeTools(
  toolIds: string[],
  config: { userId?: string; toolConfig?: Record<string, ToolConfig> } = {}
): Promise<Tool[]> {
  const tools: Tool[] = [];

  for (const toolId of toolIds) {
    const toolConfig = config.toolConfig?.[toolId] || {};

    // Skip if tool is not enabled
    if (!toolConfig.isEnabled) {
      continue;
    }

    try {
      switch (toolId) {
        case "calculator":
          tools.push(new Calculator());
          break;

        case "wikipedia":
          tools.push(
            new WikipediaQueryRun({
              topKResults: toolConfig.maxResults || 2,
            })
          );
          break;

        case "web_search":
          // Check connection state if userId provided
          if (config.userId) {
            const isConnected = await getToolConnectionState(
              config.userId,
              "web_search"
            );
            if (!isConnected) {
              console.warn(
                "Web search tool requires authentication but is not connected"
              );
              continue;
            }
          }

          // Check for API key
          const apiKey = toolConfig.apiKey || process.env.TAVILY_API_KEY;
          if (!apiKey) {
            console.warn("Tavily API key not found, skipping web search tool");
            continue;
          }

          tools.push(
            new TavilySearchResults({
              apiKey,
              maxResults: toolConfig.maxResults || 3,
            })
          );
          break;

        default:
          console.warn(`Unknown tool type: ${toolId}`);
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
