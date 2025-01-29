import { Client } from "@langchain/langgraph-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Initialize LangGraph client
const client = new Client({
  apiUrl: process.env.LANGGRAPH_URL!,
  apiKey: process.env.LANGSMITH_API_KEY!,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string; threadId: string; runId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get specific run details
    const run = await client.threads.runs.get(params.threadId, params.runId);
    return NextResponse.json(run);
  } catch (error) {
    console.error("Error fetching run:", error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string; threadId: string; runId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    let response;
    switch (action) {
      case "cancel":
        response = await client.runs.cancel(params.threadId, params.runId);
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating run:", error);
    return NextResponse.json(
      { error: "Failed to update run" },
      { status: 500 }
    );
  }
}
