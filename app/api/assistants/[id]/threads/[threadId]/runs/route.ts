import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getLangGraphClient } from "@/lib/langchain/client";

// GET - List all runs for a thread
export async function GET(
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

    // Get all runs for this thread
    const runs = await client.threads.listRuns(params.threadId);

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST - Create a new run
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

    // Create a new run
    const run = await client.threads.createRun(params.threadId, {
      assistant_id: params.id,
      checkpoint,
      input,
      command,
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error creating run:", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    );
  }
}

// DELETE - Cancel a run
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const client = getLangGraphClient();
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");

    if (!runId) {
      return NextResponse.json(
        { error: "Run ID is required" },
        { status: 400 }
      );
    }

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

    // Cancel the run
    await client.threads.cancelRun(params.threadId, runId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error canceling run:", error);
    return NextResponse.json(
      { error: "Failed to cancel run" },
      { status: 500 }
    );
  }
}
