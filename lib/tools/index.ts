import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { Tool } from "@langchain/core/tools";
import { createClient } from "@/utils/supabase/server";
import { Calculator } from "@langchain/community/tools/calculator";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { PythonInterpreterTool } from "@langchain/community/experimental/tools/pyinterpreter";

interface ToolConfig {
  maxResults?: number;
}

// Initialize and verify tool connections
async function getToolConnectionState(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("tool_connections")
    .select("*")
    .eq("user_id", userId)
    .eq("tool_id", "web_search")
    .single();

  return !!connection?.is_connected;
}

// Convert our tool definition to LangChain tool
export async function initializeTools(
  toolIds: string[],
  config: { userId?: string; toolConfig?: Record<string, ToolConfig> } = {}
): Promise<Tool[]> {
  const tools: Tool[] = [];

  // Initialize basic tools that don't require auth
  if (toolIds.includes("calculator")) {
    tools.push(new Calculator());
  }

  if (toolIds.includes("wikipedia")) {
    const userConfig = config.toolConfig?.wikipedia || {};
    tools.push(
      new WikipediaQueryRun({
        topKResults: userConfig.maxResults || 2,
      })
    );
  }

  if (toolIds.includes("code_interpreter")) {
    tools.push(new PythonInterpreterTool({}));
  }

  // Initialize web search if selected and authenticated
  if (toolIds.includes("web_search")) {
    // Check if tool is connected if userId is provided
    if (config.userId) {
      const isConnected = await getToolConnectionState(config.userId);
      if (!isConnected) {
        console.warn(
          "Web search tool requires authentication but is not connected"
        );
        return tools;
      }
    }

    try {
      if (!process.env.TAVILY_API_KEY) {
        console.warn("Tavily API key not found, skipping web search tool");
        return tools;
      }

      const userConfig = config.toolConfig?.web_search || {};

      tools.push(
        new TavilySearchResults({
          apiKey: process.env.TAVILY_API_KEY,
          maxResults: userConfig.maxResults || 3,
        })
      );
    } catch (error) {
      console.error("Error initializing web search tool:", error);
      if (config.userId) {
        const supabase = await createClient();
        await supabase.from("tool_connections").upsert({
          user_id: config.userId,
          tool_id: "web_search",
          is_connected: false,
          error: error instanceof Error ? error.message : "Unknown error",
          last_checked: new Date().toISOString(),
        });
      }
    }
  }

  return tools;
}
