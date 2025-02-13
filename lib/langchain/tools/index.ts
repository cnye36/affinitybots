import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { WolframAlphaTool } from "@langchain/community/tools/wolframalpha";
import { Tool } from "@langchain/core/tools";
import { ToolID, ToolsConfig } from "@/types";
import { AVAILABLE_TOOLS } from "./config";
import { NotionTool } from "./notion";

export function getTools(toolsConfig: ToolsConfig): Tool[] {
  const tools: Tool[] = [];

  // Add tools based on configuration
  if (toolsConfig.web_search?.isEnabled) {
    const config = {
      ...toolsConfig.web_search.config,
      apiKey: toolsConfig.web_search.credentials.api_key,
    };
    tools.push(new TavilySearchResults(config));
  }

  if (toolsConfig.wikipedia?.isEnabled) {
    tools.push(new WikipediaQueryRun());
  }

  if (toolsConfig.wolfram_alpha?.isEnabled) {
    const config = {
      appid: toolsConfig.wolfram_alpha.credentials.api_key,
    };
    tools.push(new WolframAlphaTool(config));
  }

  if (toolsConfig.notion?.isEnabled) {
    tools.push(
      new NotionTool({
        enabled: true,
        credentials: toolsConfig.notion.credentials,
        settings: toolsConfig.notion.config,
      })
    );
  }

  // Note: Twitter and Google tools will be implemented later
  return tools;
}

// Export tool types for type checking
export type { ToolID, ToolsConfig };
export { AVAILABLE_TOOLS };

// Export individual tools for direct usage if needed
export { NotionTool };
