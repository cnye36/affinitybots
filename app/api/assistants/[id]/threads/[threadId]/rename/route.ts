import { NextRequest, NextResponse } from "next/server";
import { generateChatName } from "@/lib/chat-utils";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { conversation } = await request.json();

    // Generate the chat name using the server-side function
    const title = await generateChatName(conversation);

    return NextResponse.json({ success: true, title });
  } catch (error) {
    console.error("Error generating thread title:", error);
    return NextResponse.json(
      { error: "Failed to generate thread title" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ threadId: string }> }
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

    // Get current thread state
    const state = await client.threads.getState(threadId);
    if (!state) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Update thread state with new title
    await client.threads.updateState(threadId, {
      values: {
        ...state.values,
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
