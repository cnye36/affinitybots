import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ assistantId: string; threadId: string }> }
) {
  try {
    const { assistantId, threadId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Create LangGraph client
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      // Update thread metadata with new title
      await client.threads.update(threadId, {
        metadata: {
          title: title,
          user_id: user.id,
          assistant_id: assistantId,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Thread renamed successfully",
      });
    } catch (error) {
      console.error("Thread rename failed:", error);
      return NextResponse.json(
        { error: "Failed to rename thread" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in PUT /api/assistants/[assistantId]/threads/[threadId]/rename:", error);
    return NextResponse.json(
      { error: "Failed to rename thread" },
      { status: 500 }
    );
  }
} 