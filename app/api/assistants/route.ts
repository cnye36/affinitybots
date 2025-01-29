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
    const { name, description, model, temperature, instructions, tools } = body;

    // Create a new assistant using the base agent graph with owner_id in metadata
    const assistant = await client.assistants.create({
      graphId: "agent",
      name,
      configurable: {
        model,
        temperature,
        instructions,
        tools: tools || [],
      },
      metadata: {
        owner_id: user.id,
        agent_type: "custom",
        description,
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
    console.log("Fetching assistants from Supabase - starting request");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("No user found - returning unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("User found:", user.id);

    // Query assistants by owner_id in metadata
    const { data: assistants, error } = await supabase
      .from("assistant")
      .select("*")
      .eq("graph_id", "agent")
      .filter("metadata->owner_id", "eq", user.id);

    if (error) {
      console.error("Supabase query error:", error);
      throw error;
    }

    console.log("Successfully fetched assistants:", assistants);
    return NextResponse.json(assistants || []);
  } catch (error) {
    console.error("Error fetching assistants:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
