import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { registerSchedule } from "@/lib/scheduler/scheduler";

// Create/update schedule for a workflow using BullMQ
// Body: { cron: string, triggerId?: string, timezone?: string }
export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;
  const supabase = await createClient();
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cron, triggerId, timezone } = await request.json();
    if (!cron) return NextResponse.json({ error: "Missing cron" }, { status: 400 });

    // Verify workflow ownership
    const { data: wf } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("workflow_id", workflowId)
      .single();
    if (!wf || wf.owner_id !== user.id) {
      return NextResponse.json({ error: "Workflow not found or access denied" }, { status: 404 });
    }

    // Persist cron on trigger config if provided
    if (triggerId) {
      await supabase
        .from("workflow_triggers")
        .update({ 
          config: { cron, timezone: timezone || 'UTC' }, 
          trigger_type: "schedule" 
        })
        .eq("trigger_id", triggerId)
        .eq("workflow_id", workflowId);

      // Register the schedule with BullMQ
      await registerSchedule({
        triggerId,
        workflowId,
        cronExpression: cron,
        timezone: timezone || 'UTC',
        enabled: true,
      });
    }

    return NextResponse.json({ 
      ok: true, 
      cron,
      timezone: timezone || 'UTC',
      message: 'Schedule created successfully'
    });
  } catch (e) {
    console.error("Schedule create error:", e);
    return NextResponse.json({ 
      error: "Failed to create schedule", 
      details: e instanceof Error ? e.message : String(e)
    }, { status: 500 });
  }
}


