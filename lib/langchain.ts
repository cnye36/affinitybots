import { AgentConfig } from '@/types/agent'
import { initializeTools } from './tools'

export async function initializeChatModel(agent: AgentConfig) {
  // Initialize tools based on agent configuration
  const tools = await initializeTools(agent.tools || [], agent.config?.toolsConfig)

  return { tools }
} 