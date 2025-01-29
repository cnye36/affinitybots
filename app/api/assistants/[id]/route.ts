import { Client } from "@langchain/langgraph-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Initialize LangGraph client
const client = new Client({
  apiUrl: process.env.LANGGRAPH_URL!,
  apiKey: process.env.LANGSMITH_API_KEY!,
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

    // Get assistant details
    const assistant = await client.assistants.get(params.id);

    // Verify ownership
    if (assistant.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
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

    // Get current assistant to verify ownership
    const currentAssistant = await client.assistants.get(params.id);
    if (currentAssistant.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, model, temperature, instructions, tools } = body;

    // Update assistant configuration
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

    const assistant = await client.assistants.update(params.id, {
      name,
      ...config,
    });

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Get current assistant to verify ownership
    const currentAssistant = await client.assistants.get(params.id);
    if (currentAssistant.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete the assistant
    await client.assistants.delete(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
}
