import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const params = await props.params;

  try {
    // Authentication check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const { threadId, messages } = await request.json();
    if (!threadId || !messages || messages.length < 2) {
      return NextResponse.json(
        { error: "Thread ID and at least two messages are required" },
        { status: 400 }
      );
    }

    // Verify thread belongs to this agent
    const { data: thread } = await supabase
      .from("chat_threads")
      .select("*")
      .eq("id", threadId)
      .eq("agent_id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Create chat model for title generation
    const model = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
    });

    // Generate title
    const response = await model.invoke(
      `Based on this conversation, generate a concise title (2-4 words) that captures its main topic. The title should be clear and help the user recognize what the chat is about.

User: "${messages[0].content}"
Assistant: "${messages[1].content}"

Generate only the title, nothing else.`
    );

    const newTitle = (
      typeof response.content === "string"
        ? response.content
        : response.content.toString()
    )
      .replace(/["']/g, "")
      .trim();

    // Update thread title
    const { error: updateError } = await supabase
      .from("chat_threads")
      .update({ title: newTitle })
      .eq("id", threadId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ title: newTitle });
  } catch (error) {
    console.error("Error renaming thread:", error);
    return NextResponse.json(
      { error: "Failed to rename thread" },
      { status: 500 }
    );
  }
}
