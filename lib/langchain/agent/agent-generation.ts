import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AgentConfig } from "@/types/agent";
import { AVAILABLE_TOOLS } from "@/lib/langchain/tools/config";

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
`);

const configurationPrompt = PromptTemplate.fromTemplate(`
Create a comprehensive configuration for an AI assistant based on the following description.
Focus on making the assistant highly effective at its specific task while maintaining appropriate constraints.

User's Description: {description}
Assistant Type: {agentType}

Provide the following information in a clear format:

1. NAME: Create a creative name for the assistant (1-3 words, no AI/Bot/Assistant)
2. DESCRIPTION: Write a concise summary of the assistant's capabilities
3. INSTRUCTIONS: Write a comprehensive system prompt for the assistant that defines its role and behavior
4. TOOLS: List required tools from: ${AVAILABLE_TOOLS.map((t) => t.id).join(
  ", "
)}
5. MODEL: Specify gpt-4o
6. TEMPERATURE: Provide a number between 0 and 1
7. MEMORY_WINDOW: Suggest number of past messages to consider (default: 10)
8. MEMORY_RELEVANCE: Suggest relevance threshold between 0-1 for memory retrieval (default: 0.7)

Format each response on a new line with the label, followed by a colon and the value.
Do not include any additional formatting or explanation.
`);

export async function generateAgentName(
  description: string,
  agentType: string
): Promise<string> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.9,
  });

  const formattedPrompt = await nameGeneratorPrompt.format({
    description,
    agentType,
  });

  const response = await model.invoke(formattedPrompt);
  return response.content.toString().trim();
}

export async function generateAgentConfiguration(
  description: string,
  agentType: string
): Promise<AgentConfig> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
  });

  const formattedPrompt = await configurationPrompt.format({
    description,
    agentType,
  });

  const response = await model.invoke(formattedPrompt);
  const responseText = response.content.toString();

  // Parse the response into structured data
  const lines = responseText.split("\n").filter((line) => line.trim());
  const parsedConfig: Partial<AgentConfig> = {
    config: {
      temperature: 0.7,
      memory: {
        enabled: true,
        max_entries: 10,
        relevance_threshold: 0.7,
      },
    },
  };

  // Get available tools
  const availableTools = AVAILABLE_TOOLS.map((tool) => tool.id);

  lines.forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    switch (key.trim().toUpperCase()) {
      case "NAME":
        parsedConfig.name = value;
        break;
      case "DESCRIPTION":
        parsedConfig.description = value;
        break;
      case "INSTRUCTIONS":
        parsedConfig.prompt_template = value;
        break;
      case "TOOLS":
        // Only include valid tools from the available tools list
        const requestedTools = value.split(",").map((t) => t.trim());
        parsedConfig.tools = requestedTools.filter((tool) =>
          availableTools.includes(tool)
        );
        break;
      case "MODEL":
        parsedConfig.model = value;
        break;
      case "TEMPERATURE":
        parsedConfig.config = {
          ...parsedConfig.config,
          temperature: parseFloat(value),
        };
        break;
      case "MEMORY_WINDOW":
        parsedConfig.config = {
          ...parsedConfig.config,
          memory: {
            enabled: true,
            max_entries: parseInt(value, 10),
            relevance_threshold:
              parsedConfig.config?.memory?.relevance_threshold ?? 0.7,
          },
        };
        break;
      case "MEMORY_RELEVANCE":
        parsedConfig.config = {
          ...parsedConfig.config,
          memory: {
            enabled: true,
            max_entries: parsedConfig.config?.memory?.max_entries ?? 10,
            relevance_threshold: parseFloat(value),
          },
        };
        break;
    }
  });

  // Ensure all required fields are present
  if (
    !parsedConfig.name ||
    !parsedConfig.description ||
    !parsedConfig.model ||
    !parsedConfig.prompt_template
  ) {
    throw new Error("Missing required fields in agent configuration");
  }

  // Ensure at least one tool is included
  if (!parsedConfig.tools || parsedConfig.tools.length === 0) {
    parsedConfig.tools = ["web_search"]; // Default to web search if no tools specified
  }

  return {
    id: "", // Will be set by the database
    owner_id: "", // Will be set by the server
    name: parsedConfig.name,
    description: parsedConfig.description,
    model: parsedConfig.model,
    prompt_template: parsedConfig.prompt_template,
    tools: parsedConfig.tools,
    config: parsedConfig.config || {
      temperature: 0.7,
      memory: {
        enabled: true,
        max_entries: 10,
        relevance_threshold: 0.7,
      },
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
