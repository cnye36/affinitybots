import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export const runtime = "nodejs";

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

    const state = await client.threads.getState(threadId);
    return NextResponse.json(state || { values: { messages: [] } });
  } catch (error) {
    console.error("Error fetching thread state:", error);
    return NextResponse.json(
      { error: "Failed to fetch thread state" },
      { status: 500 }
    );
  }
}
