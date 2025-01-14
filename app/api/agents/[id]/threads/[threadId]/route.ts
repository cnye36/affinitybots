import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

async function getMessagesFromMemory(threadId: string) {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from("agent_chats")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return {
    messages:
      messages?.map((msg) => ({ role: msg.role, content: msg.content })) || [],
  };
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string; threadId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get agent details to verify ownership
  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", (await props.params).id)
    .eq("owner_id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Get messages from LangGraph's memory
  const { messages } = await getMessagesFromMemory((await props.params).threadId);

  return NextResponse.json({ messages });
}
