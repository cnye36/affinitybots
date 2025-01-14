// app/api/agents/[id]/chat/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { createChatGraph, createInitialState } from "@/lib/langchain/chat";
import { HumanMessage, AIMessage } from "@langchain/core/messages";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const threadId = url.searchParams.get("threadId");

  if (!threadId) {
    return NextResponse.json(
      { error: "Thread ID is required" },
      { status: 400 }
    );
  }

  // Authentication check
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify thread ownership
  const { data: thread } = await supabase
    .from("chat_threads")
    .select("*")
    .eq("id", threadId)
    .eq("agent_id", (await props.params).id)
    .eq("user_id", user.id)
    .single();

  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  try {
    const { data: messages } = await supabase
      .from("agent_chats")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      messages:
        messages?.map((msg) => ({ role: msg.role, content: msg.content })) ||
        [],
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const supabase = await createClient();

  try {
    console.log("[POST] Starting chat request");

    // Authentication check
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("[POST] Authentication error:", userError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get request data
    const { message, threadId } = await request.json();
    console.log("[POST] Request data:", { message, threadId });

    // Get agent details
    const { data: agent } = await supabase
      .from("agents")
      .select("*")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .single();

    if (!agent) {
      console.error("[POST] Agent not found:", params.id);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    console.log("[POST] Found agent:", agent.name);

    // Create new thread if needed
    const newThreadId = threadId || crypto.randomUUID();
    if (!threadId) {
      console.log("[POST] Creating new thread:", newThreadId);
      const { error: threadError } = await supabase
        .from("chat_threads")
        .insert([
          {
            id: newThreadId,
            agent_id: params.id,
            user_id: user.id,
            title: "New Chat",
          },
        ]);

      if (threadError) {
        console.error("[POST] Thread creation error:", threadError);
        throw threadError;
      }
    }

    // Save user message to database
    console.log("[POST] Saving user message");
    const { error: userMessageError } = await supabase
      .from("agent_chats")
      .insert([
        {
          thread_id: newThreadId,
          agent_id: params.id,
          user_id: user.id,
          role: "user",
          content: message,
        },
      ]);

    if (userMessageError) {
      console.error("[POST] User message save error:", userMessageError);
      throw userMessageError;
    }

    // Get existing messages for the thread
    console.log("[POST] Fetching existing messages");
    const { data: existingMessages } = await supabase
      .from("agent_chats")
      .select("*")
      .eq("thread_id", newThreadId)
      .order("created_at", { ascending: true });

    // Convert messages to LangChain format
    const messages =
      existingMessages?.map((msg) =>
        msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
      ) || [];
    console.log("[POST] Converted messages:", messages);

    // Create chat graph and initial state
    console.log("[POST] Creating chat graph");
    const { app: graph, config } = await createChatGraph(agent, newThreadId);
    console.log("[POST] Creating initial state");
    const initialState = await createInitialState(
      message,
      params.id,
      newThreadId,
      messages
    );

    // Get the response stream
    console.log("[POST] Getting response stream");
    const stream = await graph.stream(initialState, config);

    // Create a transform stream to save assistant messages
    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        try {
          console.log("[Transform] Processing chunk:", chunk);
          // Get the assistant's message from the state
          const messages = chunk?.model?.messages || [];
          const lastMessage = messages[messages.length - 1];
          const text = lastMessage?.content || "";
          console.log("[Transform] Extracted text:", text);

          if (text.trim()) {
            // Save assistant message to database
            console.log("[Transform] Saving assistant message");
            await supabase.from("agent_chats").insert([
              {
                thread_id: newThreadId,
                agent_id: params.id,
                user_id: user.id,
                role: "assistant",
                content: text,
              },
            ]);

            // Format as SSE and forward
            const data = `data: ${JSON.stringify({ content: text })}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));
            console.log("[Transform] Sent message to client");
          }
        } catch (error) {
          console.error("[Transform] Error:", error);
          // Don't throw here, just log the error and continue
        }
      },
    });

    // Pipe through our transform
    console.log("[POST] Creating final stream");
    const finalStream = stream.pipeThrough(transformStream);

    // Return the streaming response
    console.log("[POST] Returning response");
    return new Response(finalStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Thread-Id": newThreadId,
      },
    });
  } catch (error) {
    console.error("[POST] Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "An error occurred",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
