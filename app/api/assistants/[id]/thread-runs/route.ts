import { Client } from "@langchain/langgraph-sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Initialize LangGraph client
const client = new Client({
  apiUrl: process.env.LANGGRAPH_API_URL!,
  apiKey: process.env.LANGGRAPH_API_KEY!,
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List Thread Runs
    const threadRuns = await client.runs.list(params.id);
    return NextResponse.json(threadRuns);
  } catch (error) {
    console.error("Error fetching thread runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread runs" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current session
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "No active session" }, { status: 401 });
    }

    const body = await req.json();
    const { threadId, message } = body;

    // Execute the workflow with auth token in the initial state
    const run = await client.runs.create(params.id, threadId, {
      input: {
        messages: [{ role: "user", content: message }],
      },
      metadata: {
        auth: {
          accessToken: session.access_token,
        },
        assistantId: params.id,
      },
    });

    return NextResponse.json(run);
  } catch (error) {
    console.error("Error creating thread run:", error);
    return NextResponse.json(
      { error: "Failed to create thread run" },
      { status: 500 }
    );
  }
}
