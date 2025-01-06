import { AVAILABLE_TOOLS } from './config'

interface ToolInitializationConfig {
  openAIApiKey?: string;
  modelName?: string;
  toolConfig?: Record<string, ToolConfig>;
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

type ToolParamMap = {
  web_search: SearchParams;
  web_scraper: ScraperParams;
  knowledge_base: KnowledgeParams;
  document_reader: DocumentParams;
  spreadsheet: SpreadsheetParams;
  task_scheduler: TaskParams;
  database_query: DatabaseParams;
};

interface ToolDefinition<T> {
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  invoke: (params: T) => Promise<string>;
}

interface SearchParams {
  query: string;
  maxResults?: number;
}

interface ScraperParams {
  url: string;
  selector?: string;
}

interface KnowledgeParams {
  query: string;
  collection?: string;
  limit?: number;
}

interface DocumentParams {
  documentId: string;
  fileType?: string;
}

interface SpreadsheetParams {
  operation: "read" | "write" | "append";
  data?: Record<string, unknown>;
  range?: string;
  sheetName?: string;
}

interface TaskParams {
  task: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
  timezone?: string;
}

interface DatabaseParams {
  query: string;
  maxRows?: number;
}

// Convert our tool definitions to OpenAI function format
export async function initializeTools(
  toolIds: string[],
  config: ToolInitializationConfig = {}
): Promise<{ [K in keyof ToolParamMap]?: ToolDefinition<ToolParamMap[K]> }> {
  const tools: { [K in keyof ToolParamMap]?: ToolDefinition<ToolParamMap[K]> } =
    {};

  for (const toolId of toolIds) {
    // Get tool configuration from available tools
    const toolConfig = AVAILABLE_TOOLS.find((t) => t.id === toolId);
    if (!toolConfig) continue;

    // Get user-provided configuration for this tool
    const userConfig = config.toolConfig?.[toolId] || {};

    try {
      switch (toolId) {
        case "web_search":
          if (!process.env.TAVILY_API_KEY) {
            console.warn("Tavily API key not found, skipping web search tool");
            break;
          }
          tools["web_search"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query to execute",
                },
                maxResults: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: userConfig.maxResults || 3,
                },
              },
              required: ["query"],
            },
            invoke: async (params: SearchParams) => {
              return `Searching for: ${params.query}`;
            },
          };
          break;

        case "web_scraper":
          tools["web_scraper"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "The URL to scrape",
                },
                selector: {
                  type: "string",
                  description: "CSS selector to target specific content",
                  default: userConfig.selector || "body",
                },
              },
              required: ["url"],
            },
            invoke: async (params: ScraperParams) => {
              return `Scraping URL: ${params.url}`;
            },
          };
          break;

        case "knowledge_retrieval":
          if (!process.env.QDRANT_API_KEY) {
            console.warn(
              "Qdrant API key not found, skipping knowledge retrieval tool"
            );
            break;
          }
          tools["knowledge_base"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The query to search for in the knowledge base",
                },
                collection: {
                  type: "string",
                  description: "Name of the Qdrant collection to search",
                  default: userConfig.collection || "default",
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return",
                  default: userConfig.limit || 5,
                },
              },
              required: ["query"],
            },
            invoke: async (params: KnowledgeParams) => {
              return `Searching knowledge base for: ${params.query}`;
            },
          };
          break;

        case "document_reader":
          if (!process.env.UNSTRUCTURED_API_KEY) {
            console.warn(
              "Unstructured API key not found, skipping document reader tool"
            );
            break;
          }
          tools["document_reader"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                documentId: {
                  type: "string",
                  description: "ID of the document to read",
                },
                fileType: {
                  type: "string",
                  description: "Type of file to process",
                  enum: (userConfig.fileTypes || "pdf,docx,txt").split(","),
                },
              },
              required: ["documentId"],
            },
            invoke: async (params: DocumentParams) => {
              return `Reading document: ${params.documentId}`;
            },
          };
          break;

        case "spreadsheet":
          if (
            !process.env.GOOGLE_SERVICE_ACCOUNT_KEY ||
            !userConfig.spreadsheetId
          ) {
            console.warn(
              "Google service account key or spreadsheet ID not found"
            );
            break;
          }
          tools["spreadsheet"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                operation: {
                  type: "string",
                  description: "Operation to perform",
                  enum: ["read", "write", "append"],
                },
                data: {
                  type: "object",
                  description: "Data to write or append",
                },
                range: {
                  type: "string",
                  description: "Cell range in A1 notation",
                },
                sheetName: {
                  type: "string",
                  description: "Name of the sheet",
                  default: userConfig.sheetName || "Sheet1",
                },
              },
              required: ["operation"],
            },
            invoke: async (params: SpreadsheetParams) => {
              return `Performing ${params.operation} on spreadsheet`;
            },
          };
          break;

        case "task_scheduler":
          tools["task_scheduler"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                task: {
                  type: "string",
                  description: "Task description",
                },
                dueDate: {
                  type: "string",
                  description: "Due date in ISO format",
                },
                priority: {
                  type: "string",
                  enum: ["low", "medium", "high"],
                },
                timezone: {
                  type: "string",
                  default: userConfig.timezone || "UTC",
                },
              },
              required: ["task"],
            },
            invoke: async (params: TaskParams) => {
              return `Scheduled task: ${params.task}`;
            },
          };
          break;

        case "database_query":
          if (!process.env.DATABASE_URL || !userConfig.databaseUrl) {
            console.warn("Database connection details not found");
            break;
          }
          tools["database_query"] = {
            description: toolConfig.description,
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "SQL query to execute",
                },
                maxRows: {
                  type: "number",
                  description: "Maximum number of rows to return",
                  default: userConfig.maxRows || 1000,
                },
              },
              required: ["query"],
            },
            invoke: async (params: DatabaseParams) => {
              return `Executing query: ${params.query}`;
            },
          };
          break;
      }
    } catch (error) {
      console.error(`Error initializing tool ${toolId}:`, error);
    }
  }

  return tools;
} 