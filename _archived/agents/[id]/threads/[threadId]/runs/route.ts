import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const params = await props.params;
  const { id, threadId } = params;
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

    // Validate agent ownership from the database
    const { data: userAgent, error: userAgentError } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", user.id)
      .eq("agent_id", id)
      .single();

    if (userAgentError || !userAgent) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Get the thread to verify it belongs to this agent
    const thread = await client.threads.get(threadId);

    if (!thread || thread.metadata?.agent_id !== id) {
      return NextResponse.json(
        { error: "Thread not found or doesn't belong to this agent" },
        { status: 404 }
      );
    }

    const runs = await client.runs.list(threadId);
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
  request: NextRequest,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const params = await props.params;
  const { id, threadId } = params;
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

    // Validate assistant ownership from the database
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", id)
      .single();

    if (userAssistantError || !userAssistant) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    // Get the thread to verify it belongs to this assistant
    const thread = await client.threads.get(threadId);

    if (!thread || thread.metadata?.assistant_id !== id) {
      return NextResponse.json(
        { error: "Thread not found or doesn't belong to this assistant" },
        { status: 404 }
      );
    }

    // Get assistant configuration from the database
    const { data: assistant, error: assistantError } = await supabase
      .from("assistant")
      .select("*")
      .eq("assistant_id", id)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json(
        { error: "Failed to fetch assistant configuration" },
        { status: 500 }
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
        // Use "reactAgent" as the fixed graph_id for all agents
        const graphId = "reactAgent";

        const eventStream = client.runs.stream(threadId, graphId, {
          input: { messages: [{ role: "user", content }] },
          metadata: {
            user_id: user.id,
          config: {
            tags: ["chat"],
            
            },
            configurable: {
              ...(assistant.config || {}),
              user_id: user.id,
              assistant_id: id,
              thread_id: threadId, // Pass threadId for attachment retrieval
            },
            recursion_limit: 100,
          },
          streamMode: ["messages"],
        });

        for await (const event of eventStream) {
          console.log('Stream event:', JSON.stringify(event, null, 2));
          
          // Only send events that contain actual message content (not tool calls)
          if (
            Array.isArray(event.data) &&
            event.data[0]?.content !== undefined &&
            event.data[0]?.content !== "" &&
            !(event.data[0] as any)?.tool_calls?.length &&
            !(event.data[0] as any)?.additional_kwargs?.tool_calls?.length
          ) {
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
