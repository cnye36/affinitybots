import { Search, Calculator, BookOpen, Code } from "lucide-react";
import { IconType } from "react-icons";

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  icon: IconType;
  category: "data" | "content" | "automation" | "analysis";
  requiresAuth?: boolean;
  authType?: "oauth" | "api_key" | "custom";
  requiredEnvVars?: string[];
  configOptions?: {
    name: string;
    type: "text" | "number" | "boolean";
    required?: boolean;
    default?: string | number | boolean;
    description?: string;
    isSecret?: boolean;
  }[];
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: "web_search",
    name: "Search Web",
    description:
      "Search and retrieve information from the internet using Tavily API",
    icon: Search,
    category: "data",
    requiresAuth: true,
    authType: "api_key",
    requiredEnvVars: ["TAVILY_API_KEY"],
    configOptions: [
      {
        name: "maxResults",
        type: "number",
        required: false,
        default: 3,
        description: "Maximum number of search results to return",
      },
    ],
  },
  {
    id: "calculator",
    name: "Calculator",
    description: "Perform mathematical calculations and conversions",
    icon: Calculator,
    category: "analysis",
    requiresAuth: false,
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Search and retrieve information from Wikipedia",
    icon: BookOpen,
    category: "data",
    requiresAuth: false,
    configOptions: [
      {
        name: "maxResults",
        type: "number",
        required: false,
        default: 2,
        description: "Maximum number of Wikipedia results to return",
      },
    ],
  },
  {
    id: "code_interpreter",
    name: "Code Interpreter",
    description: "Execute Python code for data analysis and computation",
    icon: Code,
    category: "analysis",
    requiresAuth: false,
  },
];
