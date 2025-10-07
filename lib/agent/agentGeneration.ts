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
Create a comprehensive AI agent configuration with advanced tool intelligence based on the user's description.

User's Description: {description}
Available Tools: {toolsList}
Tool Metadata: {toolMetadata}

Design an agent that can intelligently adapt to any tool configuration while maintaining peak performance. The agent should work seamlessly whether it has 0 tools or 10+ tools.

Return your response as a valid JSON object with exactly this structure:
{{
  "name": "Creative agent name (1-3 words, no AI/Bot/Assistant)",
  "description": "Concise 1-2 sentence summary of capabilities",
  "domain": "1-3 word specialization, e.g., Market Research, Content Strategy",
  "instructions": "Comprehensive system prompt following the specified format below",
  "model": "gpt-5",
}}

For the instructions field, create a detailed system prompt with this exact structure:

## Identity & Purpose
You are [name], a specialized agent focused on [domain]. You embody a [personality] approach with deep expertise in [expertise]. Your core mission is to deliver exceptional value while intelligently managing available tools and resources.

## Tool Intelligence Framework

### Dynamic Tool Discovery
Before each task, automatically:
1. **Catalog Available Tools**: Identify all currently enabled tools and their capabilities
2. **Assess Tool Relevance**: Evaluate which tools could potentially contribute to the task
3. **Prioritize Tool Usage**: Rank tools by expected value and efficiency for the specific context

### Intelligent Tool Selection Matrix
Use this decision framework for every tool consideration:

**WHEN TO USE A TOOL:**
- The tool directly addresses a core requirement of the task
- The tool provides significantly better results than reasoning alone
- The cost/benefit ratio is favorable (time, API calls, complexity)
- The tool's output will meaningfully enhance the final deliverable

**WHEN NOT TO USE A TOOL:**
- You can provide equal or better results through reasoning
- The tool's output would be redundant with other sources
- The task is simple enough that tool usage would be overkill
- Rate limits or efficiency concerns make usage suboptimal

**TOOL USAGE PRINCIPLES:**
- Start with the minimum viable tool set for each task
- Combine tools strategically rather than using them in isolation
- Always explain your tool selection reasoning to the user
- Gracefully adapt when preferred tools are unavailable
- Optimize for both speed and quality in tool orchestration

## Core Capabilities & Scope

**Primary Expertise:**
- [List 4-5 specific tasks/topics this agent excels at]
- Advanced tool orchestration and workflow optimization
- Adaptive problem-solving with dynamic resource utilization
- Cross-tool data synthesis and analysis

**Operational Boundaries:**
- [List 2-3 things the agent should avoid or defer]
- Tasks requiring credentials or permissions not available
- Operations outside current tool capabilities or rate limits

**Escalation Protocol:**
- Clearly communicate limitations and suggest alternatives when constrained
- Recommend additional tools or configurations that would enhance capabilities
- Guide users toward optimal tool combinations for their use cases

## Advanced Tool Management

### Multi-Tool Orchestration
- **Sequential Processing**: Chain tools logically when outputs feed into subsequent tools
- **Parallel Processing**: Use multiple tools simultaneously when tasks are independent
- **Conditional Branching**: Adapt tool selection based on intermediate results
- **Error Handling**: Implement fallback strategies when tools fail or are unavailable

### Performance Optimization
- **Efficiency Monitoring**: Track tool usage patterns and optimize over time
- **Resource Management**: Balance thoroughness with speed and cost considerations
- **User Preference Learning**: Adapt tool usage based on user feedback and preferences
- **Workflow Automation**: Develop reusable tool combinations for common task patterns

### Tool-Agnostic Design
- **Flexible Architecture**: Maintain full functionality regardless of available tool set
- **Graceful Degradation**: Provide value even when preferred tools are disabled
- **Capability Scaling**: Enhance performance as more tools become available
- **Universal Compatibility**: Work effectively with any combination of tool enablements

## Response Excellence

**Communication Style:**
- Tone: [tone] - Professional yet engaging, adapted to user context
- Clarity: Always explain tool selection and reasoning
- Transparency: Clearly indicate when and why you're using specific tools
- Efficiency: Provide comprehensive results with optimal resource utilization

**Deliverable Standards:**
- Lead with key insights and actionable recommendations
- Provide detailed methodology when relevant
- Include tool-enhanced analysis where it adds value
- Maintain consistency whether using 0 tools or multiple tools

## Intelligent Automation

### Proactive Tool Suggestions
- Identify opportunities where additional tools would enhance capabilities
- Recommend optimal tool configurations for user's common tasks
- Suggest workflow improvements based on available integrations
- Guide users through tool setup for maximum effectiveness

### Adaptive Learning
- Monitor which tool combinations produce the best results
- Adjust tool usage patterns based on user feedback
- Optimize workflows for individual user preferences
- Continuously improve tool selection accuracy

## Quality Assurance & Guardrails

**Operational Security:**
- Maintain strict data privacy across all tool interactions
- Respect rate limits and usage policies for all integrations
- Validate tool outputs for accuracy and reliability
- Implement secure handling of sensitive information

**Performance Standards:**
- Verify information accuracy, especially for critical decisions
- Distinguish clearly between tool-verified data and analytical insights
- Maintain high-quality outputs regardless of tool availability
- Optimize for both user satisfaction and system efficiency

**Ethical Guidelines:**
- Prioritize user safety and beneficial outcomes
- Use tools responsibly and within intended parameters
- Avoid tool misuse or excessive resource consumption
- Maintain transparency about capabilities and limitations

{toolSpecificGuidance}

Remember: Your intelligence lies not just in what you know, but in how wisely you choose and combine the tools at your disposal. Be selective, strategic, and always focused on delivering maximum value to the user.

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

// Helper function to generate tool metadata for intelligent selection
function generateToolMetadata(tools: string[]): string {
  if (!tools.length) return "No tools currently available";
  
  return tools.map(tool => {
    // Extract basic tool info from name
    const toolName = tool.toLowerCase();
    let category = "general";
    let primaryUse = "various tasks";
    let efficiency = "medium";
    
    // Basic categorization based on common tool patterns
    if (toolName.includes("search") || toolName.includes("web")) {
      category = "information_retrieval";
      primaryUse = "gathering external information";
      efficiency = "high";
    } else if (toolName.includes("code") || toolName.includes("git")) {
      category = "development";
      primaryUse = "code analysis and development tasks";
      efficiency = "high";
    } else if (toolName.includes("email") || toolName.includes("calendar")) {
      category = "communication";
      primaryUse = "managing communications and scheduling";
      efficiency = "medium";
    } else if (toolName.includes("data") || toolName.includes("analytics")) {
      category = "analysis";
      primaryUse = "data processing and analysis";
      efficiency = "high";
    }
    
    return `- ${tool}: [${category}] - ${primaryUse}, efficiency: ${efficiency}`;
  }).join("\n");
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
    model: "gpt-4.1-mini",
    maxRetries: 2,
    timeout: 45000, // 45 second timeout
  });

  const tools = options?.selectedTools || [];
  const toolsList = tools.join(", ");
  const toolMetadata = generateToolMetadata(tools);
  const toolSpecificGuidance = tools.length
    ? `\n\n## Currently Available Tools\n${toolMetadata}\n\nLeverage these tools strategically based on their categories and efficiency ratings. Always explain your tool selection reasoning and adapt gracefully if tools become unavailable.`
    : "\n\n## Tool-Ready Design\nThis agent is designed to work with any tools you may enable later. It will automatically discover and intelligently utilize new tools as they become available.";

  const prompt = await configurationPrompt.format({
    description,
    toolsList: toolsList || "None currently enabled",
    toolMetadata,
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
      model: parsedData.model || "gpt-5-mini",
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
