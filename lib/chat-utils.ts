import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

const titleGeneratorPrompt = PromptTemplate.fromTemplate(`
You are a helpful assistant that generates concise chat titles. Create a clear and descriptive title that captures the main topic or purpose of the conversation. The title should be 2-4 words maximum.

Based on this conversation, generate a short, descriptive title:

{conversation}

Return only the title, nothing else.
`);

export async function generateChatName(conversation: string): Promise<string> {
  try {
    const model = new ChatOpenAI({
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 20,
    });

    const formattedPrompt = await titleGeneratorPrompt.format({
      conversation,
    });

    const response = await model.invoke(formattedPrompt);
    const title = response.content.toString().trim();

    // Remove any quotes that might be in the response
    return title.replace(/["']/g, "") || "New Chat";
  } catch (error) {
    console.error("Error generating chat name:", error);
    return "New Chat";
  }
}
