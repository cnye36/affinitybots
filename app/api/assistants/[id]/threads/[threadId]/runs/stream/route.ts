import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getLangGraphClient } from "@/lib/langchain/client";

// POST - Create and stream a run
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const client = getLangGraphClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify thread ownership
    const thread = await client.threads.get(params.threadId);
    if (thread.metadata?.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { checkpoint, input, command } = body;

    // Create and stream the run
    const stream = await client.threads.createRunStream(params.threadId, {
      assistant_id: params.id,
      checkpoint,
      input,
      command,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error streaming run:", error);
    return NextResponse.json(
      { error: "Failed to stream run" },
      { status: 500 }
    );
  }
}
