import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Generic integration intake endpoint
// Body: { provider: string, event: string, data: any, secret?: string }
export async function POST(request: Request) {
  const supabase = await createClient();
  try {
    const body = await request.json().catch(() => ({}));
    const { provider, event, data, secret } = body || {};
    if (!provider || !event) return NextResponse.json({ error: "Missing provider or event" }, { status: 400 });

    // Find active triggers matching provider/event
    const { data: triggers, error } = await supabase
      .from("workflow_triggers")
      .select("trigger_id, workflow_id, config, trigger_type, is_active")
      .eq("trigger_type", "integration")
      .eq("is_active", true);
    if (error) throw error;

    const matching = (triggers || []).filter((t: any) => {
      const cfg = (t.config || {}) as any;
      const providerMatch = (cfg.provider || "").toLowerCase() === String(provider).toLowerCase();
      const eventMatch = (cfg.event || "").toLowerCase() === String(event).toLowerCase();
      const expectedSecret = cfg.secret || cfg.webhook_secret || null;
      const secretOk = expectedSecret ? expectedSecret === secret : true;
      return providerMatch && eventMatch && secretOk;
    });

    // Dispatch each workflow
    const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_BASE_URL || "";
    await Promise.all(
      matching.map(async (t: any) => {
        try {
          const res = await fetch(`${origin}/api/workflows/${t.workflow_id}/execute`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initialPayload: { provider, event, data } }),
          });
          if (!res.ok) throw new Error(await res.text());
        } catch (e) {
          console.error("Failed dispatch for trigger", t.trigger_id, e);
        }
      })
    );

    return NextResponse.json({ ok: true, dispatched: matching.length });
  } catch (e) {
    console.error("Integration intake error:", e);
    return NextResponse.json({ error: "Failed to process event" }, { status: 500 });
  }
}


