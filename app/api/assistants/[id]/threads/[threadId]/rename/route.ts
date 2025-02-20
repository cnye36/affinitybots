import { NextResponse } from "next/server";
import { generateChatName } from "@/lib/chat-utils";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export const runtime = "nodejs";

// POST - Auto-generate a title based on conversation
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const { threadId } = await props.params;
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversation } = await request.json();
    if (typeof conversation !== "string") {
      return NextResponse.json(
        { error: "Invalid conversation data" },
        { status: 400 }
      );
    }

    // Generate title
    const title = await generateChatName(conversation);

    // Get current thread
    const thread = await client.threads.get(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Update thread metadata with new title
    await client.threads.update(threadId, {
      metadata: {
        ...thread.metadata,
        title,
      },
    });

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error("Error generating thread title:", error);
    return NextResponse.json(
      { error: "Failed to generate thread title" },
      { status: 500 }
    );
  }
}

// PUT - Manually update the title
export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const { threadId } = await props.params;
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title } = await request.json();
    if (typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Invalid title" }, { status: 400 });
    }

    // Get current thread
    const thread = await client.threads.get(threadId);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Update thread metadata with new title
    await client.threads.update(threadId, {
      metadata: {
        ...thread.metadata,
        title: title.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error renaming thread:", error);
    return NextResponse.json(
      { error: "Failed to rename thread" },
      { status: 500 }
    );
  }
}
