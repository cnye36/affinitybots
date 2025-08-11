import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";


export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const params = await props.params;
  const { threadId } = params;
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_API_URL,
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
