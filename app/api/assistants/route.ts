import { Client } from "@langchain/langgraph-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Initialize LangGraph client
const client = new Client({
  apiUrl: process.env.LANGGRAPH_URL!,
  apiKey: process.env.LANGSMITH_API_KEY!,
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, model, temperature, instructions, tools } = body;

    // Create a new assistant in LangGraph with owner_id in metadata
    const assistant = await client.assistants.create({
      graphId: "agent",
      name,
      configurable: {
        model,
        temperature,
        instructions,
        tools: tools || [],
        metadata: {
          owner_id: user.id,
          agent_type: "custom",
          description: "A custom assistant created by the user",
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
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all assistants for this user using metadata filter
    const assistants = await client.assistants.search({
      metadata: {
        "configurable.metadata.owner_id": user.id,
      },
    });

    return NextResponse.json(assistants || []);
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
