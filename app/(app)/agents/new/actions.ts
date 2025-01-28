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

    // Log the request payload
    console.log("Creating LangGraph assistant with config:", {
      graph_id: "agent",
      name: agentConfig.name,
      configurable: {
        model_name: "openai",
        temperature: agentConfig.config.temperature,
        instructions: agentConfig.prompt_template,
        tools: agentConfig.tools,
        memory: agentConfig.config.memory && {
          enabled: true,
          max_entries: agentConfig.config.memory.max_entries,
          relevance_threshold: agentConfig.config.memory.relevance_threshold,
        },
      },
      metadata: {
        description: agentConfig.description,
        owner_id: user.id,
        agent_type: agentType,
      },
    });

    try {
      // Create the assistant in LangGraph
      const response = await fetch(`${process.env.LANGGRAPH_URL}/assistants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LANGGRAPH_API_KEY}`,
        },
        body: JSON.stringify({
          graph_id: "agent",
          name: agentConfig.name,
          configurable: {
            model_name: "openai",
            temperature: agentConfig.config.temperature,
            instructions: agentConfig.prompt_template,
            tools: agentConfig.tools,
            memory: agentConfig.config.memory && {
              enabled: true,
              max_entries: agentConfig.config.memory.max_entries,
              relevance_threshold:
                agentConfig.config.memory.relevance_threshold,
            },
          },
          metadata: {
            description: agentConfig.description,
            owner_id: user.id,
            agent_type: agentType,
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

      // Store the assistant details in Supabase
      const { error } = await supabase.from("assistants").insert([
        {
          assistant_id: langGraphAssistant.assistant_id,
          name: agentConfig.name,
          description: agentConfig.description,
          model_type: agentConfig.model,
          prompt_template: agentConfig.prompt_template,
          config: agentConfig.config,
          tools: agentConfig.tools,
          owner_id: user.id,
          agent_type: agentType,
        },
      ]);

      if (error) throw error;

      revalidatePath("/assistants");
      return { success: true, assistantId: langGraphAssistant.assistant_id };
    } catch (apiError) {
      console.error("LangGraph API Error:", apiError);
      // Log the full error response if available
      if (apiError instanceof Error) {
        console.error("Error details:", {
          message: apiError.message,
          stack: apiError.stack,
          // @ts-expect-error - Error response may include response data
          response: apiError.response?.data,
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error("Error creating agent:", error);
    return { error: String(error) };
  }
}
