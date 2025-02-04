import { z } from "zod";

// Tool requirement schemas
const tavilyConfigSchema = z.object({
  apiKey: z.string().optional(),
  maxResults: z.number().optional().default(3),
});

const wolframAlphaConfigSchema = z.object({
  appid: z.string(),
});

// No config needed for Wikipedia
const wikipediaConfigSchema = z.object({});

// Define available tools and their metadata
export const AVAILABLE_TOOLS = [
  {
    id: "web_search",
    name: "Web Search",
    description: "Search the web for current information using Tavily's API",
    configSchema: tavilyConfigSchema,
    isRequired: true, // This tool is required for all agents
    defaultConfig: {
      maxResults: 3,
    },
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Query Wikipedia for factual information and definitions",
    configSchema: wikipediaConfigSchema,
    isRequired: false,
    defaultConfig: {},
  },
  {
    id: "wolfram_alpha",
    name: "Wolfram Alpha",
    description: "Perform complex calculations and queries using Wolfram Alpha",
    configSchema: wolframAlphaConfigSchema,
    isRequired: false,
    defaultConfig: {},
  },
] as const;

// Type for tool IDs
export type ToolID = (typeof AVAILABLE_TOOLS)[number]["id"];

// Interface for tool configurations
export interface ToolConfiguration {
  isEnabled: boolean;
  config: Record<string, unknown>;
}

// Type for the complete tools configuration
export type ToolsConfig = Partial<Record<ToolID, ToolConfiguration>>;

// Helper to validate tool configuration
export function validateToolConfig(toolId: ToolID, config: unknown): boolean {
  const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
  if (!tool) return false;

  try {
    tool.configSchema.parse(config);
    return true;
  } catch {
    return false;
  }
}

// Helper to get default configuration for a tool
export function getDefaultToolConfig(toolId: ToolID): ToolConfiguration {
  const tool = AVAILABLE_TOOLS.find((t) => t.id === toolId);
  if (!tool) throw new Error(`Unknown tool: ${toolId}`);

  return {
    isEnabled: tool.isRequired,
    config: tool.defaultConfig,
  };
}
