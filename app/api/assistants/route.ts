import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { generateAgentConfiguration } from "@/lib/langchain/agent/agent-generation";
import { getLangGraphClient } from "@/lib/langchain/client";

export async function POST(request: Request) {
  const client = getLangGraphClient();
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { description, agentType } = body;

    // Generate the agent configuration
    const config = await generateAgentConfiguration(
      description,
      agentType,
      user.id
    );

    // Create a new assistant in LangGraph with proper structure
    const assistant = await client.assistants.create({
      graphId: "agent",
      name: config.name,
      metadata: {
        ...config.metadata,
        owner_id: user.id,
      },
      config: {
        configurable: {
          ...config.configurable,
          owner_id: undefined,
        },
      },
    });

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const client = getLangGraphClient();
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Get all assistants for this user using metadata filter
      const assistants = await client.assistants.search({
        metadata: {
          owner_id: user.id,
        },
      });

      if (!assistants) {
        return NextResponse.json([]);
      }

      // No need for additional filter since we're using metadata
      const assistantsArray = Array.isArray(assistants)
        ? assistants
        : [assistants];

      return NextResponse.json(assistantsArray);
    } catch (langGraphError) {
      console.error("LangGraph API error:", langGraphError);
      return NextResponse.json(
        { error: "Failed to fetch assistants from LangGraph" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
