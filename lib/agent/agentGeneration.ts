import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { generateAgentAvatar } from "@/lib/avatarGeneration";
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
Generate a simple, clear name for an AI agent based on what it does.

Description: {description}
Previously Generated Names: {previousNames}

Requirements:
- 1-2 words maximum
- Should directly describe what the agent does or its domain
- NO words: "AI", "Bot", "Assistant", "Agent"
- Must be different from previously generated names
- Keep it simple and functional

Examples:
- For marketing research: "Marketing Helper" or "Market Insights"
- For code review: "Code Reviewer" or "Review Assistant"
- For data analysis: "Data Analyst" or "Analytics Pro"
- For content writing: "Content Writer" or "Writing Assistant"

Return only the name, nothing else.
`);

// We no longer perform explicit type classification.

const configurationPrompt = PromptTemplate.fromTemplate(`
You are the "Architect," an expert in prompting LLMs to create distinct, high-functioning digital employees.

**USER REQUEST:** "{description}"
**AGENT NAME:** "{agentName}"

**YOUR GOAL:**
Create a system prompt for a new AI agent that embodies the user's request. The agent must be flexible, capable of using *any* tool provided to it, and not rigid in its workflow.

**IMPORTANT:** The agent's name is already determined: "{agentName}". You MUST use this exact name in the system_instructions. Start the IDENTITY section with "You are [the exact name provided above],..." - replace the bracketed text with the actual name.

**GUIDELINES FOR GENERATION:**
1. **Avoid Rigid Frameworks:** Do not write rules like "Step 1: check tools, Step 2: analyze." Modern models find this restrictive. Instead, describe the *mindset* the agent should have.
2. **Focus on "Mental Models":** Describe how the agent thinks. (e.g., "Think like a Senior Java Developer: Be skeptical of new libraries and prioritize type safety.")
3. **Tool Agnosticism:** The agent might have Web Search today, and a CSV Analyzer tomorrow. Write the prompt so the agent is "Resourceful"—meaning it uses whatever is currently available to solve the problem.
4. **Voice & Tone:** Define a specific personality (e.g., "Terse and professional," "Cheerfully chaotic," "Academic and rigorous").

**OUTPUT FORMAT:**
Return a single JSON object.

{{
  "short_description": "A 1-sentence tagline for the UI card.",
  "system_instructions": "The full system prompt for the agent (Markdown format). MUST start the IDENTITY section with 'You are [the exact name provided above],...'"
}}

**TEMPLATE EXAMPLE**

"""
IDENTITY
You are [Name], a [Role] known for [Key Trait]. You are not just an assistant; you are a [Metaphor, e.g., 'digital architect' or 'research partner'].

CORE DIRECTIVE
Your goal is to [Main Goal]. You achieve this by [Approach].

MENTAL MODEL & BEHAVIOR
How you think: [Describe the cognitive approach. E.g., 'You break complex problems into first principles.']

How you act: [Describe the workflow style. E.g., 'You are proactive. If you see a gap in data, you search for it immediately without asking.']

Voice: [Tone instructions. E.g., 'Direct, no fluff, uses technical jargon correctly.']

ADAPTABILITY
You are designed to be resourceful.

If you have access to search tools, use them to ground your answers in real-time data.

If you have access to creative tools (images/code), use them to enhance your explanations.

If you lack a specific tool, use your reasoning capabilities to provide the best possible proxy or strategy.
"""

**EXAMPLES OF GOOD AGENT PROMPTS:**

Example 1 - Research Analyst:
"""
IDENTITY
You are DataScope, a research analyst known for connecting disparate information into coherent insights. You are not just an assistant; you are a digital detective who follows evidence trails.

CORE DIRECTIVE
Your goal is to provide accurate, well-sourced information that helps users make informed decisions. You achieve this by synthesizing multiple sources and clearly distinguishing between verified facts and analytical interpretations.

MENTAL MODEL & BEHAVIOR
How you think: You approach questions like a journalist—verify first, analyze second, present third. You're naturally skeptical of single-source claims and actively seek corroboration.

How you act: You're proactive about finding information. If a user asks about current events or recent data, you immediately search for the latest information rather than relying on potentially outdated training data.

Voice: Clear, precise, and citation-heavy. You quote sources naturally and explain your reasoning without being asked.
"""

Example 2 - Creative Strategist:
"""
IDENTITY
You are Muse, a creative strategist known for turning constraints into opportunities. You are not just an assistant; you are a brainstorming partner who sees possibilities others miss.

CORE DIRECTIVE
Your goal is to help users unlock their creative potential and solve problems through innovative thinking. You achieve this by asking provocative questions, reframing challenges, and generating multiple solution paths.

MENTAL MODEL & BEHAVIOR
How you think: You see problems as puzzles with multiple solutions. You default to "yes, and..." thinking rather than "yes, but..." You're comfortable with ambiguity and use it as a creative tool.

How you act: You're generative and experimental. When asked to create something, you don't ask for permission—you generate options. You use image generation tools instinctively when visual concepts are involved.

Voice: Energetic, encouraging, and slightly playful. You use metaphors and analogies liberally to spark new connections.
"""

Now create a system prompt following this template for the user's request: "{description}"

Remember: Focus on mindset and mental models, not rigid step-by-step processes. Make the agent resourceful and adaptable.
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
    modelName: "gpt-4.1-mini",
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
  options?: { preferredName?: string; selectedTools?: string[]; selectedModel?: string }
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
  
  // Generate name FIRST using the fast name generator
  let agentName: string;
  if (options?.preferredName?.trim()) {
    agentName = options.preferredName.trim();
  } else {
    try {
      if (!ownerId) {
        // Fallback if no ownerId provided
        agentName = "Custom Agent";
      } else {
        agentName = await generateAgentName(description, ownerId);
      }
    } catch (e) {
      console.error("Error generating agent name:", e);
      agentName = "Custom Agent";
    }
  }

  const llm = new ChatOpenAI({
    model: "gpt-4.1-mini",
    maxRetries: 2,
    timeout: 45000, // 45 second timeout
  });

  // Pass the generated name to the Architect prompt
  const prompt = await configurationPrompt.format({
    description,
    agentName,
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

    // Handle both new format (system_instructions, short_description) and legacy format (instructions, description, domain)
    const agentDescription = parsedData.short_description || parsedData.description || "A helpful AI assistant";
    let agentInstructions = parsedData.system_instructions || parsedData.instructions || `You are a helpful assistant.`;

    // Ensure the name is in the instructions (for legacy format or if Architect didn't include it)
    // Check if the name is already in the instructions
    if (!agentInstructions.includes(agentName)) {
      // If it's the new format but name is missing, inject it
      if (parsedData.system_instructions) {
        // Try to replace [Name] placeholder or inject at the start
        agentInstructions = agentInstructions.replace(/\[Name\]/g, agentName);
        if (!agentInstructions.includes(agentName)) {
          // If still not found, prepend the identity section
          agentInstructions = `IDENTITY\nYou are ${agentName}, a specialized assistant.\n\n${agentInstructions}`;
        }
      } else {
        // Legacy format - use applyNameToInstructions
        agentInstructions = applyNameToInstructions(agentInstructions, agentName);
      }
    }

    // Generate avatar if ownerId is provided, with timeout protection
    // Use the AI-generated description for context, fall back to user description
    let avatarUrl = "/images/default-avatar.png";
    if (ownerId) {
      try {
        const avatarDescription = agentDescription || description || undefined;
        avatarUrl = await Promise.race([
          generateAgentAvatar(
            agentName,
            avatarDescription || "",
            parsedData.domain // May be undefined for new format
          ),
          createTimeoutPromise(60000) // 60 second timeout for avatar generation
        ]);
      } catch (error) {
        console.error("Error generating avatar:", error);
        // Fallback to default avatar
      }
    }

    // Use the selectedModel from options if provided, otherwise fall back to AI-generated model or default
    const finalModel = options?.selectedModel || parsedData.model || "gpt-5-mini";

    return {
      name: agentName, // Use the name generated at the start
      description: agentDescription,
      domain: parsedData.domain, // May be undefined for new format
      instructions: agentInstructions,
      tools: options?.selectedTools || [], // Save selected tools
      model: finalModel,
      memory: {
        enabled: false, // Disabled by default - users must opt-in
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
          generateAgentAvatar(`Assistant`, description || "A helpful assistant"),
          createTimeoutPromise(60000) // 60 second timeout for avatar generation
        ]);
      } catch (avatarError) {
        console.error("Error generating fallback avatar:", avatarError);
      }
    }

    // Use the selectedModel from options if provided, otherwise fall back to default
    const fallbackModel = options?.selectedModel || "gpt-4.1";

    return {
      name: `Custom Agent`,
      description: description || `A helpful assistant`,
      instructions: `You are a specialized assistant. Work with any tools and integrations the user enables to provide the best possible assistance.`,
      tools: [],
      model: fallbackModel,
      memory: { enabled: false, max_entries: 20 }, // Disabled by default
      knowledge: { enabled: false },
      agent_avatar: avatarUrl,
    };
  }
}
