import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const titleGeneratorPrompt = PromptTemplate.fromTemplate(`
You are a helpful assistant that generates concise chat titles. Create a clear and descriptive title that captures the main topic or purpose of the conversation. The title should be 2-4 words maximum.

Based on this conversation, generate a short, descriptive title:

{conversation}

Return only the title, nothing else. Do not include quotes or special characters.
`);

export async function generateChatName(conversation: string): Promise<string> {
  try {
    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured");
      return "New Chat";
    }

    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      openAIApiKey: process.env.OPENAI_API_KEY,
      temperature: 0.3, // Lower temperature for more consistent titles
      maxTokens: 20, // Limit tokens for short titles
    });

    const formattedPrompt = await titleGeneratorPrompt.format({
      conversation,
    });

    const response = await model.invoke(formattedPrompt);
    const title = response.content
      .toString()
      .trim()
      .replace(/["']/g, "")
      .replace(/[^\w\s-]/g, "") // Remove any special characters except spaces and hyphens
      .substring(0, 50); // Limit title length

    return title || "New Chat";
  } catch (error) {
    console.error("Error generating chat name:", error);
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error("Title generation error details:", {
        message: error.message,
        conversation: conversation.slice(0, 50) + "...",
        hasApiKey: !!process.env.OPENAI_API_KEY
      });
    }
    
    return "New Chat";
  }
}
