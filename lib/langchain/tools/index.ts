import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { WolframAlphaTool } from "@langchain/community/tools/wolframalpha";
import { Tool } from "@langchain/core/tools";
import { ToolID, ToolsConfig, AVAILABLE_TOOLS } from "./config";

export function getTools(toolsConfig: ToolsConfig = {}): Tool[] {
  const tools: Tool[] = [];

  // Always add Tavily Search - it's required
  const tavilyConfig = toolsConfig.web_search?.config || { maxResults: 3 };
  tools.push(new TavilySearchResults(tavilyConfig));

  // Add optional tools based on configuration
  if (toolsConfig.wikipedia?.isEnabled) {
    tools.push(new WikipediaQueryRun());
  }

  if (
    toolsConfig.wolfram_alpha?.isEnabled &&
    toolsConfig.wolfram_alpha.config.appid
  ) {
    tools.push(
      new WolframAlphaTool({
        appid: toolsConfig.wolfram_alpha.config.appid as string,
      })
    );
  }

  return tools;
}

// Export tool types for type checking
export type { ToolID, ToolsConfig };
export { AVAILABLE_TOOLS };

// Export individual tool getters for testing and direct usage
export function getTavilyTool(
  config: { apiKey?: string; maxResults?: number } = {}
): Tool {
  return new TavilySearchResults(config);
}

export function getWikipediaTool(): Tool {
  return new WikipediaQueryRun();
}

export function getWolframAlphaTool(appId: string): Tool {
  return new WolframAlphaTool({ appid: appId });
}
