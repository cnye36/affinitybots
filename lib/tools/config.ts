import { 
  Search, 
  Globe, 
  FileText, 
  Table, 
  MessageSquare, 
  Calendar,
  Database
} from 'lucide-react'

export interface ToolConfig {
  id: string
  name: string
  description: string
  icon: any
  category: 'data' | 'content' | 'automation' | 'analysis'
  requiresAuth?: boolean
  requiredEnvVars?: string[]
  configOptions?: {
    name: string
    type: 'text' | 'number' | 'boolean'
    required?: boolean
    default?: any
    description?: string
  }[]
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: 'web_search',
    name: 'Search Web',
    description: 'Search and retrieve information from the internet using Tavily API',
    icon: Search,
    category: 'data',
    requiredEnvVars: ['TAVILY_API_KEY'],
    configOptions: [
      {
        name: 'maxResults',
        type: 'number',
        required: false,
        default: 3,
        description: 'Maximum number of search results to return'
      }
    ]
  },
  {
    id: 'web_scraper',
    name: 'Scrape Webpage',
    description: 'Extract content and data from any webpage',
    icon: Globe,
    category: 'data',
    configOptions: [
      {
        name: 'selector',
        type: 'text',
        required: false,
        default: 'body',
        description: 'CSS selector to target specific content'
      },
      {
        name: 'headers',
        type: 'text',
        required: false,
        description: 'Custom headers for the request (JSON format)'
      }
    ]
  },
  {
    id: 'document_reader',
    name: 'Read Document',
    description: 'Extract and analyze content from documents using Unstructured API',
    icon: FileText,
    category: 'analysis',
    requiredEnvVars: ['UNSTRUCTURED_API_KEY'],
    configOptions: [
      {
        name: 'fileTypes',
        type: 'text',
        required: false,
        default: 'pdf,docx,txt',
        description: 'Comma-separated list of supported file types'
      }
    ]
  },
  {
    id: 'spreadsheet',
    name: 'Insert Row',
    description: 'Add data to Google Sheets',
    icon: Table,
    category: 'automation',
    requiresAuth: true,
    requiredEnvVars: ['GOOGLE_SERVICE_ACCOUNT_KEY'],
    configOptions: [
      {
        name: 'spreadsheetId',
        type: 'text',
        required: true,
        description: 'The ID of the Google Sheet to interact with'
      },
      {
        name: 'sheetName',
        type: 'text',
        required: false,
        default: 'Sheet1',
        description: 'Name of the sheet within the spreadsheet'
      }
    ]
  },
  {
    id: 'chat_memory',
    name: 'Conversation Memory',
    description: 'Remember context from previous conversations',
    icon: MessageSquare,
    category: 'content',
    configOptions: [
      {
        name: 'memoryKey',
        type: 'text',
        required: false,
        default: 'chat_history',
        description: 'Key to store chat history under'
      },
      {
        name: 'maxMessages',
        type: 'number',
        required: false,
        default: 10,
        description: 'Maximum number of messages to remember'
      }
    ]
  },
  {
    id: 'task_scheduler',
    name: 'Task Scheduler',
    description: 'Schedule and manage tasks',
    icon: Calendar,
    category: 'automation',
    configOptions: [
      {
        name: 'timezone',
        type: 'text',
        required: false,
        default: 'UTC',
        description: 'Timezone for scheduling tasks'
      }
    ]
  },
  {
    id: 'database_query',
    name: 'Query Database',
    description: 'Execute database queries and retrieve data',
    icon: Database,
    category: 'data',
    requiresAuth: true,
    requiredEnvVars: ['DATABASE_URL'],
    configOptions: [
      {
        name: 'databaseUrl',
        type: 'text',
        required: true,
        description: 'Database connection URL'
      },
      {
        name: 'maxRows',
        type: 'number',
        required: false,
        default: 1000,
        description: 'Maximum number of rows to return'
      }
    ]
  },
  {
    id: 'knowledge_retrieval',
    name: 'Knowledge Base',
    description: 'Search through uploaded documents and knowledge base using Qdrant',
    icon: Database,
    category: 'data',
    requiredEnvVars: ['QDRANT_API_KEY', 'QDRANT_URL'],
    configOptions: [
      {
        name: 'collection',
        type: 'text',
        required: true,
        default: 'default',
        description: 'Name of the Qdrant collection to search'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        default: 5,
        description: 'Maximum number of results to return'
      }
    ]
  }
] 