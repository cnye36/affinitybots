import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import {
  getLangGraphClient,
  cleanupLangGraphClient,
} from "@/lib/langchain/client";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const client = getLangGraphClient();
  const params = await props.params;
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      // Get the assistant by ID
      const assistant = await client.assistants.get(params.id);

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

      // Parse and format the response
      const formattedAssistant = {
        assistant_id: assistant.assistant_id,
        name: assistant.name,
        graph_id: assistant.graph_id,
        metadata: assistant.metadata,
        config: assistant.config,
      };

      return NextResponse.json(formattedAssistant);
    } catch (langGraphError) {
      console.error("LangGraph API error:", langGraphError);
      return NextResponse.json(
        { error: "Failed to fetch assistant from LangGraph" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  } finally {
    await cleanupLangGraphClient();
  }
}
