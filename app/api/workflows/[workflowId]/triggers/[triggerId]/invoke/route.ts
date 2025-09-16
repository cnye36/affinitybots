import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string; triggerId: string }> }
) {
  const { workflowId, triggerId } = await props.params;
  const supabase = await createClient();
  try {
    // Public endpoint with secret verification
    const url = new URL(request.url);
    const qsSecret = url.searchParams.get("secret");
    const hdrSecret = request.headers.get("x-webhook-secret");
    const body = await request.json().catch(() => ({}));

    // Fetch trigger config
    const { data: trig } = await supabase
      .from("workflow_triggers")
      .select("*, workflows(owner_id)")
      .eq("trigger_id", triggerId)
      .eq("workflow_id", workflowId)
      .single();
    if (!trig) return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    if (trig.trigger_type !== "webhook") {
      return NextResponse.json({ error: "Trigger is not a webhook" }, { status: 400 });
    }
    const expectedSecret = (trig.config?.webhook_secret || trig.config?.secret) as string | undefined;
    if (!expectedSecret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 400 });
    }
    if (qsSecret !== expectedSecret && hdrSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Kick off workflow execution with initial payload
    const execRes = await fetch(`${url.origin}/api/workflows/${workflowId}/execute`, {
      method: "POST",
      // Forward initial payload via header; the route reads request body only, so we include in metadata via body param soon
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initialPayload: body }),
    });

    if (!execRes.ok) {
      const err = await execRes.text();
      return NextResponse.json({ error: "Failed to start workflow", details: err }, { status: 500 });
    }
    // Proxy SSE stream
    return new Response(execRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    console.error("Webhook invoke error:", e);
    return NextResponse.json({ error: "Failed to invoke" }, { status: 500 });
  }
}


