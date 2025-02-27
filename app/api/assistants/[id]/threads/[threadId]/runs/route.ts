import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";



export async function GET(
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

    // Validate assistant ownership
    const assistant = await client.assistants.get(id);
    if (!assistant || assistant.assistant_id !== id) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    const { content } = await request.json();
    if (typeof content !== "string") {
      return NextResponse.json(
        { error: "Invalid message content" },
        { status: 400 }
      );
    }

    // Create a transform stream for SSE
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Start streaming in the background
    (async () => {
      try {
        const eventStream = client.runs.stream(threadId, id, {
          input: { messages: [{ role: "user", content }] },
          config: {
            tags: ["chat"],
            configurable: assistant.config?.configurable,
            recursion_limit: 100,
          },
          streamMode: ["messages"],
        });

        for await (const event of eventStream) {
          if (event.data?.[0]?.content !== undefined) {
            const chunk = `data: ${JSON.stringify(event.data)}\n\n`;
            await writer.write(encoder.encode(chunk));
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
        const errorEvent = {
          event: "error",
          data: { message: "An error occurred while streaming the response" },
        };
        await writer.write(
          encoder.encode(`data: ${JSON.stringify([errorEvent])}\n\n`)
        );
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in POST:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
