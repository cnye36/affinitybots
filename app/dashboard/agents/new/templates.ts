import { Search, Pencil, MessageSquare, BarChart } from 'lucide-react'

 
export const AGENT_TEMPLATES = [
    {
      id: 'research-analyst',
      name: 'Research Analyst',
      description: 'Analyzes data, conducts research, and provides detailed insights',
      icon: Search,
      defaultModel: 'gpt-4o-mini',
      tools: ['web_search', 'document_analysis', 'data_extraction'],
      basePrompt: 'You are a research analyst AI assistant...',
      keywords: ['research', 'analyze', 'study', 'investigate', 'data', 'insights']
    },
    {
      id: 'content-creator',
      name: 'Content Creator',
      description: 'Creates engaging content for blogs, social media, and marketing materials',
      icon: Pencil,
      defaultModel: 'gpt-4o-mini',
      tools: ['text_generation', 'image_analysis', 'content_optimization'],
      basePrompt: 'You are a creative content generation AI assistant...',
      keywords: ['content', 'creative', 'generation', 'blogs', 'social media', 'marketing']
    },
    {
      id: 'chat-assistant',
      name: 'Chat Assistant',
      description: 'Engages in natural conversations and provides detailed insights',
      icon: MessageSquare,
      defaultModel: 'gpt-4o-mini',
      tools: ['conversation', 'knowledge_base', 'task_management'],
      basePrompt: 'You are a helpful chat assistant...',
      keywords: ['chat', 'assistant', 'conversation', 'helpful', 'chat assistant']
    },
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      description: 'Processes and analyzes data, generates reports and insights',
      icon: BarChart,
      defaultModel: 'gpt-4o-mini',
      tools: ['data_analysis', 'visualization', 'reporting'],
      basePrompt: 'You are a data analysis AI assistant...',
      keywords: ['data', 'analysis', 'visualization', 'reporting', 'insights']
    }
  ]