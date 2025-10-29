import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ agentId: string; memoryId: string }> }
) {
  const params = await props.params;
  try {
    // Create a Supabase client
    const supabase = await createClient();

    // Verify user session
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { agentId: assistantId, memoryId } = params;

    // Verify user has access to this assistant
    const { data: userAssistant, error: accessError } = await supabase
      .from("user_assistants")
      .select("*")
      .eq("user_id", user.id)
      .eq("assistant_id", assistantId)
      .single();

    if (accessError || !userAssistant) {
      console.error("Access denied or assistant not found:", accessError);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete the memory row from platform store table
    // Memories can be stored with different prefix formats
    const prefixDot = `user_profile.${assistantId}`;
    const prefixJson = JSON.stringify(["user_profile", assistantId]);
    
    // Use separate delete operations to avoid PostgREST parsing issues with JSON arrays
    const { error: delError1 } = await supabase
      .from("store")
      .delete()
      .eq("prefix", prefixDot)
      .eq("key", memoryId);
    
    const { error: delError2 } = await supabase
      .from("store")
      .delete()
      .eq("prefix", prefixJson)
      .eq("key", memoryId);
    
    if (delError1 || delError2) {
      console.error("Error deleting memory:", delError1 || delError2);
      throw delError1 || delError2;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
