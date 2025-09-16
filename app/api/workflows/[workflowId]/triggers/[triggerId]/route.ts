import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET a trigger
export async function GET(
  request: Request,
  props: { params: Promise<{ workflowId: string; triggerId: string }> }
) {
  const { workflowId, triggerId } = await props.params;
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: wf } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("workflow_id", workflowId)
      .single();
    if (!wf || wf.owner_id !== user.id) {
      return NextResponse.json({ error: "Workflow not found or access denied" }, { status: 404 });
    }

    const { data: trig, error } = await supabase
      .from("workflow_triggers")
      .select("*")
      .eq("trigger_id", triggerId)
      .eq("workflow_id", workflowId)
      .single();
    if (error || !trig) return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    return NextResponse.json(trig);
  } catch (e) {
    console.error("Error getting trigger:", e);
    return NextResponse.json({ error: "Failed to get trigger" }, { status: 500 });
  }
}

// Update a trigger
export async function PUT(
  request: Request,
  props: { params: Promise<{ workflowId: string; triggerId: string }> }
) {
  const { workflowId, triggerId } = await props.params;
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const { data: wf } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("workflow_id", workflowId)
      .single();
    if (!wf || wf.owner_id !== user.id) {
      return NextResponse.json({ error: "Workflow not found or access denied" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, trigger_type, config } = body || {};

    const { data: trig, error } = await supabase
      .from("workflow_triggers")
      .update({
        name,
        description,
        trigger_type,
        config,
        updated_at: new Date().toISOString(),
      })
      .eq("trigger_id", triggerId)
      .eq("workflow_id", workflowId)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json(trig);
  } catch (e) {
    console.error("Error updating trigger:", e);
    return NextResponse.json({ error: "Failed to update trigger" }, { status: 500 });
  }
}


