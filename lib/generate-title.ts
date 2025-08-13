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
    const model = new ChatOpenAI({
      modelName: "gpt-5-mini-2025-08-07",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const formattedPrompt = await titleGeneratorPrompt.format({
      conversation,
    });

    const response = await model.invoke(formattedPrompt);
    const title = response.content
      .toString()
      .trim()
      .replace(/["']/g, "")
      .replace(/[^\w\s-]/g, ""); // Remove any special characters except spaces and hyphens

    return title || "New Chat";
  } catch (error) {
    console.error("Error generating chat name:", error);
    return "New Chat";
  }
}
