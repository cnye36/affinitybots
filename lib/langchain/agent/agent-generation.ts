import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { AgentConfigurableOptions } from "@/lib/langchain/agent/config";
import { ToolConfig } from "@/types/tools";
import { generateAgentAvatar } from "@/lib/image-generation";
import {
  AVAILABLE_TOOLS,
  getDefaultToolConfig,
} from "@/lib/langchain/tools/config";
import type { ToolID } from "@/lib/langchain/tools/config";

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

Available Tools:
${Object.values(AVAILABLE_TOOLS)
  .map((t) => `- ${t.name}: ${t.description}`)
  .join("\n")}

Note: Web Search (Tavily) is always included by default.

Provide the following information in a clear format:

1. NAME: Create a creative name for the assistant (1-3 words, no AI/Bot/Assistant)
2. DESCRIPTION: Write a concise summary of the assistant's capabilities
3. INSTRUCTIONS: Write a comprehensive system prompt for the assistant that defines its role and behavior
4. TOOLS: List required tools from: ${Object.keys(AVAILABLE_TOOLS).join(", ")}
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

interface GeneratedConfig {
  name: string;
  configurable: AgentConfigurableOptions;
  metadata: {
    owner_id: string;
    description: string;
    agent_type: string;
  };
}

export async function generateAgentConfiguration(
  description: string,
  agentType: string,
  ownerId: string
): Promise<GeneratedConfig> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.7,
  });

  const formattedPrompt = await configurationPrompt.format({
    description,
    agentType,
    ownerId,
  });

  const response = await model.invoke(formattedPrompt);
  const responseText = response.content.toString();

  // Parse the response into structured data
  const lines = responseText.split("\n").filter((line) => line.trim());
  const config: Partial<GeneratedConfig> = {
    configurable: {
      model: "gpt-4o",
      temperature: 0.7,
      tools: {
        web_search: getDefaultToolConfig("web_search"),
        wikipedia: getDefaultToolConfig("wikipedia"),
        wolfram_alpha: getDefaultToolConfig("wolfram_alpha"),
        notion: getDefaultToolConfig("notion"),
        twitter: getDefaultToolConfig("twitter"),
        google: getDefaultToolConfig("google"),
      },
      memory: {
        enabled: true,
        max_entries: 10,
        relevance_threshold: 0.7,
      },
      prompt_template: "",
      knowledge_base: { isEnabled: false, config: { sources: [] } },
      avatar: "/default-avatar.png",
    },
    metadata: {
      owner_id: ownerId,
      description: "",
      agent_type: agentType,
    },
  };

  lines.forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    const value = valueParts.join(":").trim();

    switch (key.trim().toUpperCase()) {
      case "NAME":
        config.name = value;
        break;
      case "DESCRIPTION":
        if (config.metadata) {
          config.metadata.description = value;
        }
        break;
      case "INSTRUCTIONS":
        if (config.configurable) {
          config.configurable.prompt_template = value;
        }
        break;
      case "TOOLS":
        if (config.configurable) {
          // Initialize tools configuration
          const toolsConfig: Record<ToolID, ToolConfig> = {
            web_search: getDefaultToolConfig("web_search"),
            wikipedia: getDefaultToolConfig("wikipedia"),
            wolfram_alpha: getDefaultToolConfig("wolfram_alpha"),
            notion: getDefaultToolConfig("notion"),
            twitter: getDefaultToolConfig("twitter"),
            google: getDefaultToolConfig("google"),
          };

          // Update requested tools to enabled
          const requestedTools = value
            .split(",")
            .map((t) => t.trim() as ToolID);
          requestedTools.forEach((toolId) => {
            if (AVAILABLE_TOOLS[toolId as ToolID]) {
              toolsConfig[toolId] = getDefaultToolConfig(toolId);
              toolsConfig[toolId].isEnabled = true;
            }
          });

          config.configurable.tools = toolsConfig;
        }
        break;
      case "MODEL":
        if (config.configurable) {
          config.configurable.model = value as "gpt-4o";
        }
        break;
      case "TEMPERATURE":
        if (config.configurable) {
          config.configurable.temperature = parseFloat(value);
        }
        break;
      case "MEMORY_WINDOW":
        if (config.configurable?.memory) {
          config.configurable.memory.max_entries = parseInt(value, 10);
        }
        break;
      case "MEMORY_RELEVANCE":
        if (config.configurable?.memory) {
          config.configurable.memory.relevance_threshold = parseFloat(value);
        }
        break;
    }
  });

  // After the name is set in the forEach loop, generate the avatar
  if (config.name && config.configurable) {
    config.configurable.avatar = await generateAgentAvatar(
      config.name,
      agentType
    );
  }

  // Ensure all required fields are present
  if (
    !config.name ||
    !config.configurable?.prompt_template ||
    !config.metadata?.description
  ) {
    throw new Error("Missing required fields in agent configuration");
  }

  return config as GeneratedConfig;
}
