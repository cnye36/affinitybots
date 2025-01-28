"use server";

import { createClient } from "@/supabase/server";
import { revalidatePath } from "next/cache";
import { generateAgentConfiguration } from "@/lib/langchain/agent/agent-generation";

export async function createAgent(formData: FormData) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const prompt = formData.get("prompt") as string;
    const agentType = formData.get("agentType") as string;

    // Generate AI-powered configuration
    const agentConfig = await generateAgentConfiguration(prompt, agentType);

    try {
      // Create the assistant in LangGraph with proper configuration
      const response = await fetch(`${process.env.LANGGRAPH_URL}/assistants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LANGSMITH_API_KEY}`,
        },
        body: JSON.stringify({
          graph_id: "agent",
          name: agentConfig.name,
          config: {
            configurable: agentConfig.configurable,
            metadata: agentConfig.metadata,
          },
        }),
      });

      // Log the raw response
      const rawText = await response.text();
      console.log("Raw LangGraph API Response:", rawText);

      if (!response.ok) {
        throw new Error(`LangGraph API error: ${rawText}`);
      }

      const langGraphAssistant = JSON.parse(rawText);
      console.log("LangGraph assistant created:", langGraphAssistant);

      revalidatePath("/agents");
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
    return { error: String(error) };
  }
}
