import { Client } from "@langchain/langgraph-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Initialize LangGraph client
const client = new Client({
  apiUrl: process.env.LANGGRAPH_API_URL!,
  apiKey: process.env.LANGGRAPH_API_KEY!,
});

export async function POST(request: Request) {
  try {
    // Get user session
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, model, temperature, instructions, tools } = body;

    // Create a new assistant using the base agent graph
    const config = {
      configurable: {
        model,
        temperature,
        instructions,
        tools: tools || [],
      },
      metadata: {
        description,
        owner_id: user.id,
      },
    };

    const assistant = await client.assistants.create({
      graphId: "agent", // This refers to our base agent graph
      name,
      ...config,
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
    // Get user session
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all assistants for this user
    const assistants = await client.assistants.search({
      metadata: {
        owner_id: user.id,
      },
    });

    return NextResponse.json({ assistants });
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
