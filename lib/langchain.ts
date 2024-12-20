import { ChatOpenAI } from '@langchain/openai'
import { AgentConfig } from '@/types/agent'
import { BufferMemory } from 'langchain/memory'
import { initializeTools } from './tools'

export async function initializeChatModel(agent: AgentConfig) {
  // Initialize memory
  const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "chat_history",
  })

  // Initialize tools based on agent configuration
  const tools = await initializeTools(agent.tools || [], agent.config?.toolsConfig)

  // Initialize the ChatOpenAI model
  const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: agent.model_type,
    temperature: agent.config?.temperature ?? 0.7,
    streaming: true,
  })

  return { chatModel, tools, memory }
} 