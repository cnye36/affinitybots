import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ assistantId: string; memoryId: string }> }
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

    const { assistantId, memoryId } = params;

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
    const prefix = JSON.stringify(["user_profile", assistantId]);
    const { error: delError } = await supabase
      .from("store")
      .delete()
      .match({ prefix, key: memoryId });
    if (delError) throw delError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting memory:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500 }
    );
  }
}
