import { Search, Brain, Database } from "lucide-react";

export const AVAILABLE_MCP_SERVERS = {
  tavily: {
    name: "Tavily Search",
    description: "AI-powered web search and content extraction",
    icon: Brain,
    requiredCredentials: ["tavily_api_key"],
    isEnabled: true, // Tavily is always enabled by default
  },
  sequential_thinking: {
    name: "Sequential Thinking",
    description: "Think step by step",
    icon: Brain,
    requiredCredentials: [],
  },
  notionApi: {
    name: "Notion API",
    description: "Notion API",
    icon: Brain,
    requiredCredentials: ["notion_integration_secret"],
  },
};
