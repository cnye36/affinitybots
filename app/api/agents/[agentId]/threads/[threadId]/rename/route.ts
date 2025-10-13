import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { generateChatName } from "@/lib/generateTitle";

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ agentId: string; threadId: string }> }
) {
  try {
    const { agentId: assistantId, threadId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require the first user message text to be provided explicitly
    let conversation: string | undefined;
    try {
      const body = await request.json();
      if (body && typeof body.conversation === "string") {
        conversation = body.conversation.trim();
      }
    } catch {
      // ignore JSON errors
    }
    if (!conversation) {
      return NextResponse.json(
        { error: "Missing conversation text for title generation" },
        { status: 400 }
      );
    }

    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    // 1) Generate a title
    const title = await generateChatName(conversation);

    // 2) Read existing thread to preserve other metadata if present
    const thread = await client.threads.get(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // 3) Update thread metadata with new title and identifiers
    await client.threads.update(threadId, {
      metadata: {
        ...(thread.metadata || {}),
        title,
        user_id: user.id,
        assistant_id: assistantId,
      },
    });

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error(
      "Error in POST /api/agents/[agentId]/threads/[threadId]/rename:",
      error
    );
    return NextResponse.json(
      { error: "Failed to generate thread title" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ agentId: string; threadId: string }> }
) {
  try {
    const { agentId: assistantId, threadId } = await props.params;
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
      apiUrl: process.env.LANGGRAPH_API_URL!,
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
    console.error("Error in PUT /api/agents/[agentId]/threads/[threadId]/rename:", error);
    return NextResponse.json(
      { error: "Failed to rename thread" },
      { status: 500 }
    );
  }
} 