"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { generateAgentConfiguration } from "@/lib/langchain/agent/agent-generation";
import { Client } from "@langchain/langgraph-sdk";

export async function createAgent(formData: FormData) {
  const supabase = await createClient();
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const prompt = formData.get("prompt") as string;
    const agentType = formData.get("agentType") as string;

    // Generate AI-powered configuration
    const agentConfig = await generateAgentConfiguration(
      prompt,
      agentType,
      user.id
    );

    try {
      // Create the assistant using LangGraph client
      const langGraphAssistant = await client.assistants.create({
        graphId: "agent",
        name: agentConfig.name,
        metadata: agentConfig.metadata,
        config: {
          configurable: agentConfig.configurable,
        },
      });

      console.log("LangGraph assistant created:", langGraphAssistant);

      revalidatePath("/assistants");
      revalidatePath("/");

      return { success: true, assistant: langGraphAssistant };
    } catch (apiError) {
      console.error("LangGraph API Error:", apiError);
      if (apiError instanceof Error) {
        console.error("Error details:", {
          message: apiError.message,
          stack: apiError.stack,
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
}
