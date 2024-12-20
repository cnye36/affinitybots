import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { AgentConfig } from '@/types/agent'

const nameGeneratorPrompt = PromptTemplate.fromTemplate(`
Given the following agent description and type, generate a creative and memorable name for the AI agent.
The name should be professional yet engaging, and reflect the agent's primary function.

Agent Type: {agentType}
Description: {description}

Requirements:
- Name should be 1-3 words
- Should be memorable and unique
- Should reflect the agent's purpose
- Should be professional enough for business use
- Should not include the words "AI", "Bot", or "Assistant"

Return only the name, nothing else.
`)

const configurationPrompt = PromptTemplate.fromTemplate(`
Create a comprehensive configuration for an AI agent based on the following description.
Focus on making the agent highly effective at its specific task while maintaining appropriate constraints.

User's Description: {description}
Agent Type: {agentType}

Provide the following information in a clear format:

1. NAME: Create a creative and memorable name (1-3 words)
2. DESCRIPTION: Write a summary of the agent's capabilities
3. PROMPT_TEMPLATE: Write a comprehensive system prompt for the agent
4. TOOLS: List recommended tools, separated by commas
5. MODEL_TYPE: Specify gpt-4o
6. TEMPERATURE: Provide a number between 0 and 1
7. MAX_TOKENS: Provide a number for maximum tokens

Format each response on a new line with the label, followed by a colon and the value.
Do not include any additional formatting or explanation.
`)

export async function generateAgentName(description: string, agentType: string): Promise<string> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.7
  })

  const formattedPrompt = await nameGeneratorPrompt.format({
    description,
    agentType
  })

  const response = await model.invoke(formattedPrompt)
  return response.content.toString().trim()
}

export async function generateAgentConfiguration(
  description: string,
  agentType: string
): Promise<AgentConfig> {
  const model = new ChatOpenAI({
    modelName: 'gpt-4o',
    temperature: 0.7
  })

  const formattedPrompt = await configurationPrompt.format({
    description,
    agentType
  })

  const response = await model.invoke(formattedPrompt)
  const responseText = response.content.toString()
  
  // Parse the response into structured data
  const lines = responseText.split('\n').filter(line => line.trim())
  const config: Record<string, any> = {}
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':')
    const value = valueParts.join(':').trim()
    
    switch (key.trim().toUpperCase()) {
      case 'NAME':
        config.name = value
        break
      case 'DESCRIPTION':
        config.description = value
        break
      case 'PROMPT_TEMPLATE':
        config.prompt_template = value
        break
      case 'TOOLS':
        config.tools = value.split(',').map(t => t.trim())
        break
      case 'MODEL_TYPE':
        config.model_type = value
        break
      case 'TEMPERATURE':
        config.config = {
          ...config.config,
          temperature: parseFloat(value)
        }
        break
      case 'MAX_TOKENS':
        config.config = {
          ...config.config,
          max_tokens: parseInt(value)
        }
        break
    }
  })

  return config as AgentConfig
} 