import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { generateAgentAvatar } from "@/lib/avatar-generation";
import type { AssistantConfiguration } from "@/types/assistant";

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

// Agent profile is derived purely from the user's description now, so we
// no longer maintain a static set of type configs.

const nameGeneratorPrompt = PromptTemplate.fromTemplate(`
Generate a creative, memorable, and unique name for an AI agent based on the description.

Description: {description}
Previously Generated Names: {previousNames}

Requirements:
- 1-3 words maximum
- Professional yet engaging
- Reflects the agent's purpose
- NO words: "AI", "Bot", "Assistant"
- Must be completely different from previously generated names
- Should feel personal and distinctive

Style options (choose one that fits best):
1. Wordplay related to function (e.g., "Insight Navigator" for research)
2. Human name + expertise (e.g., "Marcus Analytics", "Luna Content")
3. Abstract concept (e.g., "Nexus", "Prism", "Catalyst")
4. Mythological reference (e.g., "Apollo Research", "Athena Strategy")

Return only the name, nothing else.
`);

// We no longer perform explicit type classification.

const configurationPrompt = PromptTemplate.fromTemplate(`
Create a comprehensive AI agent configuration based solely on the user's description.

User's Description: {description}

Infer the agent's domain/specialization, personality, and appropriate tone. The agent must be tool-agnostic and work with any integrations the user may enable later.

If the user has selected specific tools, incorporate them into the prompt design so the agent proactively leverages them where appropriate.

Selected Tools (qualified names, may be empty): {toolsList}

Return your response as a valid JSON object with exactly this structure:
{{
  "name": "Creative agent name (1-3 words, no AI/Bot/Assistant)",
  "description": "Concise 1-2 sentence summary of capabilities",
  "domain": "1-3 word specialization, e.g., Market Research, Content Strategy",
  "instructions": "Comprehensive system prompt following the specified format below",
  "model": "gpt-5-2025-08-07",
}}

For the instructions field, create a detailed system prompt with this exact structure:

## Identity
You are [name], a specialized agent focused on [domain]. You embody a [personality] approach to your work with deep expertise in [expertise].

## Scope
**In Scope:**
- [List 4-5 specific tasks/topics this agent excels at]
- Tool utilization and integration management
- Adaptive problem-solving within the domain

**Out of Scope:**
- [List 2-3 things the agent should avoid or defer]
- Tasks requiring specialized credentials you don't have access to

**Escalation:**
- When requests fall outside your expertise, clearly explain limitations and suggest alternatives
- For sensitive or complex issues beyond your scope, recommend consulting appropriate specialists

## Responsibility
- Proactively identify the best approach for each task
- Utilize available tools and integrations intelligently based on user preferences
- Maintain high standards of accuracy and thoroughness
- Provide clear, actionable recommendations and deliverables
- Adapt methodology based on available resources and tools

## Response Style
- Tone: [tone]
- Format: Clear, structured responses with actionable insights
- Communication: Direct and professional while maintaining engagement
- Explain reasoning and methodology when relevant

## Ability
- Leverage any available tools and integrations dynamically
- Adapt workflows based on user-enabled MCP servers and capabilities
- Synthesize information from multiple sources and tools
- Provide comprehensive analysis and recommendations
- Learn from user preferences and feedback to improve responses

## Tool Integration
- Automatically detect and utilize relevant tools for each task
- Explain which tools you're using and why
- Gracefully handle scenarios where preferred tools aren't available
- Suggest tool configurations that would enhance your capabilities
- Optimize workflows based on available integrations
{toolSpecificGuidance}

## Guardrails
- Maintain data privacy and security in all operations
- Verify information accuracy, especially for business-critical decisions
- Respect rate limits and usage guidelines for all tools and APIs
- Clearly distinguish between verified facts and informed analysis
- Always prioritize user safety and ethical considerations

## Instructions
- Begin each interaction by understanding the full context and requirements
- Identify the most appropriate tools and approach for the task
- Execute tasks systematically, providing updates on progress
- Deliver comprehensive results with clear explanations
- End interactions by confirming completion and offering next steps
- For complex projects, break them into manageable phases and checkpoints
`);

// Helper function to create a timeout promise
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

// Ensure the final chosen name is reflected inside the instructions text
function applyNameToInstructions(originalInstructions: string | undefined, finalName: string): string {
  const instructions = (originalInstructions || '').trim();
  if (!instructions) {
    return `## Identity\nYou are ${finalName}, a specialized assistant.\n`;
  }

  // Replace explicit placeholder first
  let updated = instructions.replace(/You are \[name\]/i, `You are ${finalName}`);

  // Replace the first occurrence of "You are <something>" with the final name
  updated = updated.replace(/(^|\n)You are\s+[^,\n]+/i, (_m, p1) => `${p1}You are ${finalName}`);

  // If no identity line exists, prepend one
  if (!/You are\s+[^,\n]+/i.test(updated)) {
    updated = `## Identity\nYou are ${finalName}, a specialized assistant.\n\n` + updated;
  }

  return updated;
}

export async function generateAgentName(
  description: string,
  ownerId: string
): Promise<string> {
  const model = new ChatOpenAI({
    modelName: "gpt-5-mini-2025-08-07",
    maxRetries: 2,
    timeout: 30000, // 30 second timeout
  });

  const previousNames = userGeneratedNames.get(ownerId).join(", ");

  const formattedPrompt = await nameGeneratorPrompt.format({
    description,
    previousNames: previousNames || "None yet",
  });

  try {
    // Add timeout protection
    const response = await Promise.race([
      model.invoke(formattedPrompt),
      createTimeoutPromise(30000) // 30 second timeout
    ]);
    
    const generatedName = response.content.toString().trim();
    userGeneratedNames.add(ownerId, generatedName);
    return generatedName;
  } catch (error) {
    console.error("Error generating agent name:", error);
    // Fallback to a simple name
    return `Custom Agent`;
  }
}


export interface GeneratedConfig {
  owner_id: string;
  name: string;
  description: string;
  agent_avatar: string;
  config: AssistantConfiguration;
  metadata: Record<string, unknown>;
}

export async function generateAgentConfiguration(
  description: string,
  ownerId?: string,
  options?: { preferredName?: string; selectedTools?: string[] }
): Promise<{
  name: string;
  description: string;
  domain?: string;
  instructions: string;
  tools: string[];
  model: string;
  memory: { enabled: boolean; max_entries: number };
  knowledge: { enabled: boolean };
  agent_avatar: string;
}> {
  

  const llm = new ChatOpenAI({
    model: "gpt-5-mini-2025-08-07",
    maxRetries: 2,
    timeout: 45000, // 45 second timeout
  });

  const tools = options?.selectedTools || [];
  const toolsList = tools.join(", ");
  const toolSpecificGuidance = tools.length
    ? `\nWhen appropriate, prefer using these tools if they fit the task: ${toolsList}. Always state which tool you plan to use and why before invoking it.`
    : "";

  const prompt = await configurationPrompt.format({
    description,
    toolsList: toolsList || "None",
    toolSpecificGuidance,
  });

  try {
    // Add timeout protection
    const response = await Promise.race([
      llm.invoke(prompt),
      createTimeoutPromise(45000) // 45 second timeout
    ]);
    
    const content = response.content as string;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Always generate or override with a stronger, unique name
    let finalName = options?.preferredName?.trim();
    if (!finalName) {
      try {
        if (!ownerId) throw new Error("ownerId required for strong naming");
        finalName = await generateAgentName(description, ownerId);
      } catch (e) {
        // fall back to model-provided name
        finalName = parsedData.name;
      }
    }

    // Generate avatar if ownerId is provided, with timeout protection
    let avatarUrl = "/images/default-avatar.png";
    if (ownerId) {
      try {
        avatarUrl = await Promise.race([
          generateAgentAvatar(finalName || parsedData.name, parsedData.domain || "assistant"),
          createTimeoutPromise(60000) // 60 second timeout for avatar generation
        ]);
      } catch (error) {
        console.error("Error generating avatar:", error);
        // Fallback to default avatar
      }
    }

    const finalInstructions = applyNameToInstructions(
      parsedData.instructions || `You are a helpful assistant.`,
      finalName || parsedData.name || "Assistant"
    );

    return {
      name: finalName || parsedData.name || "Unnamed Agent",
      description: parsedData.description || "A helpful AI assistant",
      domain: parsedData.domain,
      instructions: finalInstructions,
      tools, // Save selected tools
      model: parsedData.model || "gpt-5-mini-2025-08-07",
      memory: {
        enabled: true,
        max_entries: 20,
      },
      knowledge: {
        enabled: false,
      },
      agent_avatar: avatarUrl,
    };
  } catch (error) {
    console.error("Error parsing agent configuration:", error);

    // Fallback configuration with avatar generation
    let avatarUrl = "/images/default-avatar.png";
    if (ownerId) {
      try {
        avatarUrl = await Promise.race([
          generateAgentAvatar(`Assistant`, "assistant"),
          createTimeoutPromise(60000) // 60 second timeout for avatar generation
        ]);
      } catch (avatarError) {
        console.error("Error generating fallback avatar:", avatarError);
      }
    }

    return {
      name: `Custom Agent`,
      description: description || `A helpful assistant`,
      instructions: `You are a specialized assistant. Work with any tools and integrations the user enables to provide the best possible assistance.`,
      tools: [],
      model: "gpt-4.1",
      memory: { enabled: true, max_entries: 20 },
      knowledge: { enabled: false },
      agent_avatar: avatarUrl,
    };
  }
}
