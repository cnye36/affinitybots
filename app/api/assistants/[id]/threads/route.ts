import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  props: { params: Promise<{ assistant_id: string }> }
) {
  const params = await props.params;
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
  });

  console.log("LangGraph Url", process.env.LANGGRAPH_URL);
  
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thread = await client.threads.create({
      metadata: {
        user_id: user.id,
        assistant_id: params.assistant_id,
      },
    });
    return NextResponse.json({ thread_id: thread.thread_id });
  } catch (error) {
    console.error("Error creating thread:", error);
    return NextResponse.json(
      { error: "Failed to create thread" },
      { status: 500 }
    );
  }
}

// GET - List all threads for an assistant
export async function GET(
  request: Request,
  props: { params: Promise<{ assistant_id: string }> }
) {
  const params = await props.params;
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

    const threads = await client.threads.search({
      metadata: {
        user_id: user.id,
        assistant_id: params.assistant_id,
      },
    });
    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Error fetching threads:", error);
    return NextResponse.json(
      { error: "Failed to fetch threads" },
      { status: 500 }
    );
  }
} 