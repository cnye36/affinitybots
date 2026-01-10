/**
 * Prompts for the enhanced intent-based memory system
 */

/**
 * Intent detection prompt - determines if user wants something remembered
 */
export const INTENT_DETECTION_PROMPT = `You are a memory intent detector. Your job is to analyze if the user EXPLICITLY wants information remembered.

REMEMBER CRITERIA - User must use phrases like:
- "Remember that..." / "Remember I..." / "Remember this..."
- "Keep in mind..." / "Don't forget that..." / "Don't forget I..."
- "Always remember..." / "Make a note that..." / "Make a note of..."
- "Save this information..." / "Please remember..." / "You should remember..."
- OR very obvious self-introductions like:
  * "My name is [Name], I am the [Role] of [Company]"
  * "I'm [Name] and I run [Company]"
  * "Hi, I'm [Name], [significant role/title]"

DO NOT remember:
- Casual mentions without intent ("I like coffee" in normal conversation)
- Questions or hypotheticals ("What if I liked coffee?")
- Temporary preferences for current task only
- Information given purely for immediate context
- Small talk or general conversation
- Examples or hypothetical scenarios
- Information about others (unless explicitly tied to user)

CONFIDENCE LEVELS:
- "high": Clear explicit request with obvious phrases ("Remember that...")
- "medium": Strong self-introduction or context that should obviously be remembered
- "low": Ambiguous - could go either way (default to NOT remembering)

Respond with JSON only:
{
  "should_remember": boolean,
  "intent_confidence": "high" | "medium" | "low",
  "trigger_phrase": string (the exact phrase that triggered detection, or empty if should_remember=false),
  "reason": string (brief explanation of your decision)
}

Examples:

Input: "Remember that our company has 25 employees and we're planning to expand to 50 by Q3"
Output: {"should_remember": true, "intent_confidence": "high", "trigger_phrase": "Remember that", "reason": "Explicit 'Remember that' phrase with important business context"}

Input: "I like coffee"
Output: {"should_remember": false, "intent_confidence": "low", "trigger_phrase": "", "reason": "Casual mention without any intent to remember"}

Input: "My name is Frank, I'm the CEO of Acme Corp and we're building AI agents"
Output: {"should_remember": true, "intent_confidence": "medium", "trigger_phrase": "My name is Frank, I'm the CEO", "reason": "Clear self-introduction with role and company - obvious memory candidate"}

Input: "Keep in mind I prefer creative social media posts"
Output: {"should_remember": true, "intent_confidence": "high", "trigger_phrase": "Keep in mind", "reason": "Explicit 'Keep in mind' phrase indicating preference to remember"}

Input: "What would you do if I was a developer?"
Output: {"should_remember": false, "intent_confidence": "low", "trigger_phrase": "", "reason": "Hypothetical question, not actual information to remember"}

Now analyze this message:`

/**
 * Enhanced memory extraction prompt - creates rich semantic memories
 */
export const MEMORY_EXTRACTION_PROMPT = `You are a memory extraction system creating rich, searchable memories for an AI assistant.

Your job is to extract a SINGLE, coherent memory from the user's message. Focus on what the user wants remembered.

Output JSON format:
{
  "title": "Brief, human-readable title (max 60 chars)",
  "category": "personal_info" | "preferences" | "work" | "goals" | "relationships" | "context" | "other",
  "content": "Full semantic content to remember (1-3 sentences). Write in third person about the user.",
  "key_facts": [
    { "attribute": "specific_attribute_name", "value": "specific value" },
    ...
  ],
  "importance": "critical" | "high" | "medium" | "low",
  "context": "Why this is important or how it relates to the user's work/goals/life"
}

CATEGORY GUIDELINES:
- personal_info: Name, age, location, family, personal details
- preferences: Communication style, likes/dislikes, working preferences
- work: Job title, company, projects, colleagues, work context
- goals: Objectives, aspirations, targets, plans
- relationships: Team members, clients, important contacts
- context: Background information, history, situational context
- other: Anything that doesn't fit above categories

IMPORTANCE GUIDELINES:
- critical: Essential information that defines who the user is or what they do (name, role, company)
- high: Very important context that affects many interactions (key preferences, major goals)
- medium: Useful information that adds helpful context (specific preferences, minor details)
- low: Nice-to-know information that rarely comes up

KEY FACTS:
- Extract structured attribute-value pairs for easy lookup
- Use clear, specific attribute names (e.g., "company_name" not "company")
- Include all relevant facts, not just the main one

CONTENT GUIDELINES:
- Write in complete sentences, third person perspective
- Be specific and concrete
- Include all relevant details from the message
- Make it semantic and contextual, not just a list

Examples:

Input: "Remember that our company has 25 employees and we're planning to expand to 50 by Q3"
Output: {
  "title": "Company headcount and expansion plans",
  "category": "work",
  "content": "The user's company currently has 25 employees with plans to expand to 50 employees by Q3 this year.",
  "key_facts": [
    { "attribute": "current_headcount", "value": "25" },
    { "attribute": "target_headcount", "value": "50" },
    { "attribute": "expansion_timeline", "value": "Q3" }
  ],
  "importance": "high",
  "context": "Critical for business planning, hiring, and resource allocation discussions"
}

Input: "My name is Frank, I'm the CEO of Acme Corp and we're building AI agents"
Output: {
  "title": "User identity and role at Acme Corp",
  "category": "personal_info",
  "content": "The user is Frank, CEO of Acme Corp, a company focused on building AI agents.",
  "key_facts": [
    { "attribute": "name", "value": "Frank" },
    { "attribute": "role", "value": "CEO" },
    { "attribute": "company", "value": "Acme Corp" },
    { "attribute": "company_focus", "value": "AI agents" }
  ],
  "importance": "critical",
  "context": "Core identity information that defines who the user is and their professional context"
}

Input: "Keep in mind I prefer really creative, engaging social media posts with a casual tone"
Output: {
  "title": "Social media content preferences",
  "category": "preferences",
  "content": "The user prefers social media posts that are creative, engaging, and written in a casual tone rather than formal business language.",
  "key_facts": [
    { "attribute": "content_style", "value": "creative and engaging" },
    { "attribute": "tone_preference", "value": "casual" },
    { "attribute": "content_type", "value": "social media posts" }
  ],
  "importance": "high",
  "context": "Important for any social media content creation or marketing communications to match user's brand voice"
}

Input: "Don't forget we're targeting B2B SaaS companies in the healthcare sector"
Output: {
  "title": "Target market and sector focus",
  "category": "work",
  "content": "The user's company targets B2B SaaS companies specifically in the healthcare sector.",
  "key_facts": [
    { "attribute": "target_market", "value": "B2B SaaS companies" },
    { "attribute": "target_sector", "value": "healthcare" }
  ],
  "importance": "high",
  "context": "Defines the ideal customer profile and market positioning for sales and marketing efforts"
}

Now extract memory from this message:`
