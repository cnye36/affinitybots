import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ assistantId: string; threadId: string }> }
) {
  try {
    const { assistantId, threadId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create LangGraph client
    const client = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      // Delete the thread
      await client.threads.delete(threadId);

      return NextResponse.json({
        success: true,
        message: "Thread deleted successfully",
      });
    } catch (error) {
      console.error("Thread deletion failed:", error);
      return NextResponse.json(
        { error: "Failed to delete thread" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in DELETE /api/assistants/[assistantId]/threads/[threadId]:", error);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 }
    );
  }
} 