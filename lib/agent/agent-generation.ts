import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { generateAgentAvatar } from "@/lib/avatar-generation";
import type { AgentConfiguration, ModelType } from "@/types/agent";

// Store previously generated names per user with a maximum cache size
const MAX_USERS_IN_CACHE = 1000; // Maximum number of users to store in cache
const MAX_NAMES_PER_USER = 50; // Maximum number of names to store per user

// Simple LRU cache for storing agent names per user
class UserNamesCache {
  private cache: Map<string, string[]> = new Map();
  private userQueue: string[] = []; // Track user access order for LRU

  add(userId: string, name: string): void {
    // Update user position in the queue (most recently used)
    this.updateUserPosition(userId);

    // Get or initialize the user's name list
    const names = this.cache.get(userId) || [];

    // Add the new name if it doesn't already exist
    if (!names.includes(name)) {
      names.push(name);

      // Limit the number of names per user
      if (names.length > MAX_NAMES_PER_USER) {
        names.shift(); // Remove oldest name
      }
    }

    // Update the cache
    this.cache.set(userId, names);
  }

  get(userId: string): string[] {
    this.updateUserPosition(userId);
    return this.cache.get(userId) || [];
  }

  private updateUserPosition(userId: string): void {
    // Remove user from current position
    const index = this.userQueue.indexOf(userId);
    if (index !== -1) {
      this.userQueue.splice(index, 1);
    }

    // Add user to the end (most recently used)
    this.userQueue.push(userId);

    // Evict least recently used user if cache is full
    if (this.userQueue.length > MAX_USERS_IN_CACHE) {
      const lruUser = this.userQueue.shift();
      if (lruUser) {
        this.cache.delete(lruUser);
      }
    }
  }
}

const userGeneratedNames = new UserNamesCache();

const nameGeneratorPrompt = PromptTemplate.fromTemplate(`
Generate a creative, memorable, and unique name for an AI agent based on the following description and type.
The name should be professional yet engaging, distinctive, and futuristic-sounding.

Agent Type: {agentType}
Description: {description}
Previously Generated Names: {previousNames}

Approach options (choose one that best fits):
1. Clever wordplay related to the agent's function (e.g., "Nexus Knowledge" for research)
2. Human-name combination (e.g., "Insight Irene", "Research Robby", "Viral Vickie")
3. Abstract concept + functional term (e.g., "Prism Analytics", "Quantum Scribe")
4. Mythological or historical reference related to the function (e.g., "Apollo Scholar", "Hermes Connect")
5. Short, punchy single word with depth (e.g., "Cipher", "Pulse", "Nexus")

Requirements:
- Name should be 1-3 words (can include a human first name as one of the words)
- Must be memorable, unique, and NOT similar to any of the previously generated names
- Should clearly reflect the agent's primary purpose
- Professional enough for business use
- Should NOT include the words "AI", "Bot", or "Assistant"
- Should feel distinct and personalized

CREATE A NAME THAT IS COMPLETELY DIFFERENT FROM ANY PREVIOUSLY GENERATED NAMES.

Return only the name, nothing else.
`);

const configurationPrompt = PromptTemplate.fromTemplate(`
Create a comprehensive configuration for an AI agent based on the following description.
Focus on making the agent highly effective at its specific task while maintaining appropriate constraints.

User's Description: {description}
Agent Type: {agentType}

Available Tools:
- Web Search: AI-powered web search and content extraction
- Various MCP servers available through the Smithery registry

Note: Tools can be configured and enabled after agent creation through the agent configuration interface.

Provide the following information in a clear format:

1. NAME: Create a creative name for the agent (1-3 words, no AI/Bot/Assistant)
2. DESCRIPTION: Write a concise summary of the agent's capabilities
3. INSTRUCTIONS: Create a detailed and structured system prompt that follows this format:
   
   ## Identity
   [Define who the agent is and its primary role]
   
   ## Scope
   - [List what tasks/topics the agent should focus on]
   - [List what the agent should NOT handle]
   - [Define escalation path for out-of-scope requests]
   
   ## Responsibility
   - [How the agent should manage interactions]
   - [Key tasks the agent should perform]
   - [How to handle edge cases]
   
   ## Response Style
   - [Tone and communication style]
   - [Format preferences]
   - [Any specific language patterns to use or avoid]
   
   ## Ability
   - [What capabilities the agent has]
   - [When to use specific tools at its disposal]
   
   ## Guardrails
   - [Privacy considerations]
   - [Accuracy requirements]
   - [Ethical guidelines]
   
   ## Instructions
   - [Specific operational instructions with examples where helpful]
   - [Handling edge cases]
   - [Closing interactions]

4. TOOLS: List suggested tools that would be helpful for this agent (generic descriptions)
5. MODEL: Specify gpt-4o
6. TEMPERATURE: Provide a number between 0 and 1
7. MEMORY_WINDOW: Suggest number of past messages to consider (default: 10)
8. MEMORY_RELEVANCE: Suggest relevance threshold between 0-1 for memory retrieval (default: 0.7)

Format each response on a new line with the label, followed by a colon and the value.
Do not include any placeholders like [COMPANY NAME] or [PRODUCT] in the instructions - the user will add specific details later.
The instructions should be comprehensive and specific to the agent type without requiring further customization.
Do not include any additional formatting or explanation.
`);

export async function generateAgentName(
  description: string,
  agentType: string,
  ownerId: string
): Promise<string> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 1.0,
  });

  // Get previously generated names for this user
  const previousNames = userGeneratedNames.get(ownerId).join(", ");

  const formattedPrompt = await nameGeneratorPrompt.format({
    description,
    agentType,
    previousNames: previousNames || "None yet",
  });

  const response = await model.invoke(formattedPrompt);
  const generatedName = response.content.toString().trim();

  // Store the new name in the user's cache
  userGeneratedNames.add(ownerId, generatedName);

  return generatedName;
}

export interface GeneratedConfig {
  owner_id: string;
  name: string;
  description: string;
  agent_avatar: string;
  agent_type: string;
  config: AgentConfiguration;
  metadata: Record<string, unknown>;
}

export async function generateAgentConfiguration(
  description: string,
  agentType: string = "general"
): Promise<{
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  model: string;
  temperature: number;
  memory: { enabled: boolean; max_entries: number };
  knowledge: { enabled: boolean };
}> {
  const llm = new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.3,
  });

  const prompt = await configurationPrompt.format({
    description,
    agentType,
  });

  const response = await llm.invoke(prompt);
  const content = response.content as string;

  try {
    // Extract JSON from the response
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonStr);

    return {
      name: parsed.name || "Unnamed Agent",
      description: parsed.description || "No description provided",
      instructions: parsed.instructions || "You are a helpful AI assistant.",
      tools: [], // Tools are configured separately through the UI
      model: parsed.model || "gpt-4o-mini",
      temperature: parsed.temperature || 0.7,
      memory: {
        enabled: parsed.memory?.enabled || false,
        max_entries: parsed.memory?.max_entries || 50,
      },
      knowledge: {
        enabled: parsed.knowledge?.enabled || false,
      },
    };
  } catch (error) {
    console.error("Error parsing agent configuration:", error);
    
    // Fallback configuration
    return {
      name: "Custom Agent",
      description: description || "A helpful AI assistant",
      instructions: `You are a helpful AI assistant focused on: ${description}`,
      tools: [],
      model: "gpt-4o-mini",
      temperature: 0.7,
      memory: { enabled: false, max_entries: 50 },
      knowledge: { enabled: false },
    };
  }
}
