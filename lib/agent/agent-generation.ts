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

// Agent type specific configurations
const AGENT_TYPE_CONFIGS = {
  "market-research-analyst": {
    personality: "analytical and data-driven",
    expertise: "market research, competitive analysis, trend identification",
    focus: "delivering actionable business insights through comprehensive market analysis",
    tone: "professional and authoritative",
    temperature: 0.3,
  },
  "content-strategist": {
    personality: "creative and strategic",
    expertise: "content strategy, editorial planning, content optimization",
    focus: "developing compelling content strategies across multiple channels",
    tone: "engaging and strategic",
    temperature: 0.7,
  },
  "customer-service-rep": {
    personality: "empathetic and solution-oriented",
    expertise: "customer support, issue resolution, relationship management",
    focus: "providing exceptional customer experiences with patience and professionalism",
    tone: "friendly, helpful, and patient",
    temperature: 0.4,
  },
  "business-analyst": {
    personality: "logical and detail-oriented",
    expertise: "business analysis, data interpretation, process optimization",
    focus: "analyzing complex business data to drive informed decision-making",
    tone: "analytical and objective",
    temperature: 0.2,
  },
  "product-manager": {
    personality: "strategic and collaborative",
    expertise: "product management, roadmap planning, stakeholder coordination",
    focus: "driving product success through strategic planning and execution",
    tone: "strategic and collaborative",
    temperature: 0.5,
  },
  "virtual-assistant": {
    personality: "organized and proactive",
    expertise: "administrative support, task management, organization",
    focus: "efficiently managing administrative tasks and schedules",
    tone: "professional and organized",
    temperature: 0.3,
  },
  "social-media-manager": {
    personality: "creative and community-focused",
    expertise: "social media strategy, content creation, community engagement",
    focus: "building engaging online communities through strategic content",
    tone: "engaging and creative",
    temperature: 0.8,
  },
  "financial-analyst": {
    personality: "meticulous and analytical",
    expertise: "financial analysis, modeling, investment research",
    focus: "providing accurate financial insights and investment recommendations",
    tone: "precise and professional",
    temperature: 0.2,
  },
  "innovation-consultant": {
    personality: "visionary and creative",
    expertise: "innovation strategy, creative problem-solving, strategic thinking",
    focus: "generating breakthrough solutions and fostering innovation",
    tone: "inspiring and creative",
    temperature: 0.9,
  },
  "technical-writer": {
    personality: "precise and clear",
    expertise: "technical documentation, user guides, API documentation",
    focus: "creating clear and comprehensive technical documentation",
    tone: "clear and instructional",
    temperature: 0.3,
  },
  "general": {
    personality: "adaptable and helpful",
    expertise: "general assistance and problem-solving",
    focus: "providing versatile support across various tasks and domains",
    tone: "helpful and professional",
    temperature: 0.6,
  },
};

const nameGeneratorPrompt = PromptTemplate.fromTemplate(`
Generate a creative, memorable, and unique name for an AI agent based on the following description and type.

Agent Type: {agentType}
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

const configurationPrompt = PromptTemplate.fromTemplate(`
Create a comprehensive AI agent configuration that excels at {agentType} tasks.

User's Description: {description}
Agent Type: {agentType}
Agent Personality: {personality}
Agent Expertise: {expertise}

Create a configuration that works seamlessly with ANY tools or integrations the user might enable later. The agent should be adaptable and tool-agnostic.

Return your response as a valid JSON object with exactly this structure:
{{
  "name": "Creative agent name (1-3 words, no AI/Bot/Assistant)",
  "description": "Concise 1-2 sentence summary of capabilities",
  "instructions": "Comprehensive system prompt following the specified format below",
  "model": "gpt-4.1",
  "temperature": {temperature}
}}

For the instructions field, create a detailed system prompt with this exact structure:

## Identity
You are [name], a specialized {agentType} focused on {focus}. You embody a {personality} approach to your work, bringing deep expertise in {expertise}.

## Scope
**In Scope:**
- [List 4-5 specific tasks/topics this agent excels at]
- Tool utilization and integration management
- Adaptive problem-solving within your domain

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
- Adapt your methodology based on available resources and tools

## Response Style
- Tone: {tone}
- Format: Clear, structured responses with actionable insights
- Communication: Direct and professional while maintaining engagement
- Always explain your reasoning and methodology when relevant

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

export async function generateAgentName(
  description: string,
  agentType: string,
  ownerId: string
): Promise<string> {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 1.0,
  });

  const previousNames = userGeneratedNames.get(ownerId).join(", ");

  const formattedPrompt = await nameGeneratorPrompt.format({
    description,
    agentType,
    previousNames: previousNames || "None yet",
  });

  const response = await model.invoke(formattedPrompt);
  const generatedName = response.content.toString().trim();

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
  agentType: string = "general",
  ownerId?: string
): Promise<{
  name: string;
  description: string;
  instructions: string;
  tools: string[];
  model: string;
  temperature: number;
  memory: { enabled: boolean; max_entries: number };
  knowledge: { enabled: boolean };
  agent_avatar: string;
}> {
  // Get agent type configuration
  const typeConfig = AGENT_TYPE_CONFIGS[agentType as keyof typeof AGENT_TYPE_CONFIGS] || AGENT_TYPE_CONFIGS.general;

  const llm = new ChatOpenAI({
    model: "gpt-4.1",
    temperature: 0.3,
  });

  const prompt = await configurationPrompt.format({
    description,
    agentType,
    personality: typeConfig.personality,
    expertise: typeConfig.expertise,
    focus: typeConfig.focus,
    tone: typeConfig.tone,
    temperature: typeConfig.temperature,
  });

  try {
    const response = await llm.invoke(prompt);
    const content = response.content as string;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    // Generate avatar if ownerId is provided
    let avatarUrl = "/images/default-avatar.png";
    if (ownerId) {
      try {
        avatarUrl = await generateAgentAvatar(parsedData.name, agentType);
      } catch (error) {
        console.error("Error generating avatar:", error);
        // Fallback to default avatar
      }
    }

    return {
      name: parsedData.name || "Unnamed Agent",
      description: parsedData.description || "A helpful AI assistant",
      instructions: parsedData.instructions || `You are a helpful ${agentType} assistant.`,
      tools: [], // No tools enabled by default - user configures these later
      model: parsedData.model || "gpt-4.1",
      temperature: parsedData.temperature || typeConfig.temperature,
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
        avatarUrl = await generateAgentAvatar(`${agentType} Agent`, agentType);
      } catch (avatarError) {
        console.error("Error generating fallback avatar:", avatarError);
      }
    }

    return {
      name: `${agentType.charAt(0).toUpperCase() + agentType.slice(1)} Agent`,
      description: description || `A helpful ${agentType} assistant`,
      instructions: `You are a specialized ${agentType} assistant. ${typeConfig.focus}. You work with any tools and integrations the user enables to provide the best possible assistance.`,
      tools: [],
      model: "gpt-4.1",
      temperature: typeConfig.temperature,
      memory: { enabled: true, max_entries: 20 },
      knowledge: { enabled: false },
      agent_avatar: avatarUrl,
    };
  }
}
