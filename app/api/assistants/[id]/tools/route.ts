import { Client } from "@langchain/langgraph-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getAllAvailableTools, updateToolConfig } from "@/lib/tools";

// Initialize LangGraph client
const client = new Client({
  apiUrl: process.env.LANGGRAPH_API_URL!,
  apiKey: process.env.LANGGRAPH_API_KEY!,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get assistant details to verify ownership
    const assistant = await client.assistants.get(params.id);
    if (assistant.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get all available tools and their configurations
    const tools = getAllAvailableTools();
    return NextResponse.json({ tools });
  } catch (error) {
    console.error("Error fetching tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch tools" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get assistant details to verify ownership
    const assistant = await client.assistants.get(params.id);
    if (assistant.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { toolId, enabled, config } = body;

    // Update tool configuration
    updateToolConfig(toolId, enabled, config);

    // Update assistant configuration with new tool settings
    const updatedAssistant = await client.assistants.update(params.id, {
      config: {
        ...assistant.config,
        tools: getAllAvailableTools()
          .filter((tool) => tool.config.enabled)
          .map((tool) => ({
            name: tool.id,
            config: tool.config,
          })),
      },
    });

    return NextResponse.json(updatedAssistant);
  } catch (error) {
    console.error("Error updating tools:", error);
    return NextResponse.json(
      { error: "Failed to update tools" },
      { status: 500 }
    );
  }
}
