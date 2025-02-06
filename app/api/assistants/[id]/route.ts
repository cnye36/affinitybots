import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getLangGraphClient } from "@/lib/langchain/client";

export async function GET(
  request: Request,
  { params }: { params: { assistant_id: string } }
) {
  const client = getLangGraphClient();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Get the assistant by assistant_id
    const assistant = await client.assistants.get(params.assistant_id);

    if (!assistant) {
      return NextResponse.json(
        { error: "Assistant not found" },
        { status: 404 }
      );
    }

    // Verify the assistant belongs to the current user
    if (assistant.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(assistant);
  } catch (langGraphError) {
    console.error("LangGraph API error:", langGraphError);
    return NextResponse.json(
      { error: "Failed to fetch assistant from LangGraph" },
      { status: 500 }
    );
  }
}
