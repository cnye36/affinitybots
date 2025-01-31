import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getLangGraphClient } from "@/lib/langchain/client";

// GET - Get a specific run
export async function GET(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string; runId: string }> }
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

    // Get the specific run
    const run = await client.threads.getRun(params.threadId, params.runId);

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error fetching run:", error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}
