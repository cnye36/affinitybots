import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

// GET - List recent runs for a thread
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const { threadId } = await props.params;
  const client = new Client();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const runs = await client.threads.get(threadId);
    return NextResponse.json(runs || []);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST - Create a new run/message in a thread
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const { id, threadId } = await props.params;
  const client = new Client();
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate assistant ownership
    const assistant = await client.assistants.get(id);
    if (!assistant || assistant.assistant_id !== id) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    const { content } = await request.json();

    // Initiate a streaming run
    const stream = client.runs.stream(threadId, id, {
      input: { messages: [{ role: "user", content }] },
      config: {
        tags: ["chat"],
        configurable: assistant.config?.configurable,
        recursion_limit: 100,
      },
      streamMode: ["messages"],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk.data)}\n\n`)
            );
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in POST:", error);
    return NextResponse.json({ error: "Failed to start run" }, { status: 500 });
  }
}
