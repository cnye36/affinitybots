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
  configOptions?: {
    name: string
    type: 'text' | 'number' | 'boolean'
    required?: boolean
    default?: any
  }[]
}

export const AVAILABLE_TOOLS: ToolConfig[] = [
  {
    id: 'web_search',
    name: 'Search Web',
    description: 'Search and retrieve information from the internet',
    icon: Search,
    category: 'data',
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
        default: 'body'
      }
    ]
  },
  {
    id: 'document_reader',
    name: 'Read Document',
    description: 'Extract and analyze content from documents',
    icon: FileText,
    category: 'analysis',
  },
  {
    id: 'spreadsheet',
    name: 'Insert Row',
    description: 'Add data to spreadsheets',
    icon: Table,
    category: 'automation',
    requiresAuth: true,
    configOptions: [
      {
        name: 'spreadsheetId',
        type: 'text',
        required: true
      }
    ]
  },
  {
    id: 'chat_memory',
    name: 'Conversation Memory',
    description: 'Remember context from previous conversations',
    icon: MessageSquare,
    category: 'content'
  },
  {
    id: 'task_scheduler',
    name: 'Task Scheduler',
    description: 'Schedule and manage tasks',
    icon: Calendar,
    category: 'automation',
  },
  {
    id: 'database_query',
    name: 'Query Database',
    description: 'Execute database queries and retrieve data',
    icon: Database,
    category: 'data',
    requiresAuth: true
  },
  {
    id: 'knowledge_retrieval',
    name: 'Knowledge Base',
    description: 'Search through uploaded documents and knowledge base',
    icon: Database,
    category: 'data',
    configOptions: [
      {
        name: 'collection',
        type: 'text',
        required: true,
        default: 'default'
      },
      {
        name: 'limit',
        type: 'number',
        required: false,
        default: 5
      }
    ]
  }
] 