export interface AgentConfig {
  id: string
  name: string
  description: string
  model_type: string
  prompt_template: string
  tools: string[] // Define more specific types based on tools
  config: {
    temperature?: number
    enableKnowledge?: boolean
    // Add other config parameters as needed
  }
  // Include other fields from the agents table as necessary
} 