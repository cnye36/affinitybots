import { Search, Brain, Database } from "lucide-react";

export const AVAILABLE_MCP_SERVERS = {
  memory: {
    name: "Memory Server",
    description: "Provides memory and knowledge graph capabilities",
    icon: Database,
    requiredCredentials: [],
  },
  brave_search: {
    name: "Brave Search",
    description: "Search the web using Brave's API",
    icon: Search,
    requiredCredentials: ["brave_api_key"],
  },
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
};
