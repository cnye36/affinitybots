import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/agent/reactAgent";
import { createClient } from "@/supabase/client";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; memoryId: string }> }
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

    const { id: agentId, memoryId } = params;

    // The memory key is stored as the memoryId
    // We need to delete from the correct namespace
    const namespace = ["user_profile", agentId];

    // Delete the memory
    await store.delete(namespace, memoryId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
