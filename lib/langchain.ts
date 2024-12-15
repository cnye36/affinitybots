import { ChatOpenAI } from '@langchain/openai'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from '@langchain/core/prompts'
import { AgentConfig } from '@/types'
import { BaseMessage } from '@langchain/core/messages'
import { BufferMemory } from 'langchain/memory'
import { initializeTools } from './tools'
import { initializeAgentExecutorWithOptions } from 'langchain/agents'

export class AgentInitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentInitializationError'
  }
}

export async function initializeLangChain(agent: AgentConfig) {
  try {
    // Validate required fields
    validateAgentConfig(agent)

    // Initialize tools
    const tools = await initializeTools(agent.tools || [], agent.config?.toolsConfig)

    // Create a prompt template with error handling
    const prompt = PromptTemplate.fromTemplate(agent.prompt_template)

    // Initialize the language model with validated configuration
    const llm = new ChatOpenAI({
      modelName: agent.model_type,
      temperature: agent.config?.temperature ?? 0.7,
      maxTokens: agent.config?.max_tokens,
      streaming: true,
      callbacks: [{
        handleLLMStart: async () => {
          console.log('Starting LLM chain...')
        },
        handleLLMError: async (err: Error) => {
          console.error('LLM error:', err)
        },
        handleLLMEnd: async () => {
          console.log('LLM chain completed')
        }
      }]
    })

    // Create an agent executor with tools
    const executor = await initializeAgentExecutorWithOptions(tools, llm, {
      agentType: "chat-conversational-react-description",
      verbose: process.env.NODE_ENV === 'development',
    })

    return executor
  } catch (error) {
    if (error instanceof AgentInitializationError) {
      throw error
    }
    throw new AgentInitializationError(`Failed to initialize agent: ${error.message}`)
  }
}

// Helper function to format agent responses
export function formatAgentResponse(response: string | BaseMessage[]): string {
  if (Array.isArray(response)) {
    return response.map(msg => msg.content).join('\n')
  }
  return response
}

// Helper to validate agent configuration
export function validateAgentConfig(config: AgentConfig): void {
  if (!config.prompt_template) {
    throw new AgentInitializationError('Prompt template is required')
  }
  if (!config.model_type) {
    throw new AgentInitializationError('Model type is required')
  }
  if (config.config?.temperature !== undefined && (config.config.temperature < 0 || config.config.temperature > 2)) {
    throw new AgentInitializationError('Temperature must be between 0 and 2')
  }
  if (config.config?.max_tokens !== undefined && config.config.max_tokens < 1) {
    throw new AgentInitializationError('Max tokens must be greater than 0')
  }
  // Additional validations as needed
} 