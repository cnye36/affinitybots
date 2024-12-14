import { ChatOpenAI } from '@langchain/openai'
import { LLMChain } from 'langchain/chains'
import { PromptTemplate } from '@langchain/core/prompts'
import { AgentConfig } from '@/types'
import { BaseMessage } from '@langchain/core/messages'
import { BufferMemory } from 'langchain/memory'

export class AgentInitializationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentInitializationError'
  }
}

export function initializeLangChain(agent: AgentConfig) {
  try {
    // Validate required fields
    if (!agent.prompt_template) {
      throw new AgentInitializationError('Prompt template is required')
    }

    if (!agent.model_type) {
      throw new AgentInitializationError('Model type is required')
    }

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

    // Initialize memory if enabled
    const memory = agent.config?.use_memory 
      ? new BufferMemory({
          memoryKey: "chat_history",
          returnMessages: true,
          inputKey: "message",
          outputKey: "response",
        })
      : undefined

    // Create an LLMChain with memory support
    const chain = new LLMChain({
      llm,
      prompt,
      memory,
      verbose: process.env.NODE_ENV === 'development',
      outputKey: "response",
    })

    return chain
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
  if (config.config?.temperature && (config.config.temperature < 0 || config.config.temperature > 2)) {
    throw new AgentInitializationError('Temperature must be between 0 and 2')
  }
  if (config.config?.max_tokens && config.config.max_tokens < 1) {
    throw new AgentInitializationError('Max tokens must be greater than 0')
  }
} 