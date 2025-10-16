import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

// GET - List runs for a workflow
export async function GET(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;
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

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    // Get all runs for this workflow
    const runs = await client.runs.list(workflow.assistant_id);

    return NextResponse.json(runs || []);
  } catch (error) {
    console.error("Error fetching runs:", error);
    return NextResponse.json(
      { error: "Failed to fetch runs" },
      { status: 500 }
    );
  }
}

// POST - Create a new workflow run
export async function POST(
  request: Request,
  props: { params: Promise<{ workflowId: string }> }
) {
  const { workflowId } = await props.params;
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

    // Verify workflow ownership
    const { data: workflow } = await supabase
      .from("workflows")
      .select("*")
      .eq("workflow_id", workflowId)
      .single();

    if (!workflow || workflow.owner_id !== user.id) {
      return NextResponse.json(
        { error: "Workflow not found or access denied" },
        { status: 404 }
      );
    }

    const { input, config } = await request.json();

    // Request a background run and immediately return the run descriptor
    // Avoid polling or snapshot heuristics; rely on the platform to enqueue and return an id
    const requested = await client.runs.create(
      workflow.assistant_id,
      workflow.thread_id || "",
      {
        input,
        config: {
          ...config,
          tags: ["workflow"],
          metadata: {
            workflow_id: workflowId,
            user_id: user.id,
          },
          configurable: {
            ...(config?.configurable || {}),
            user_id: user.id,
            assistant_id: workflow.assistant_id,
          },
        },
        streamMode: ["messages"],
      }
    );

    // Normalize response to include id/status without waiting for materialization
    // The SDK may return varying shapes; defensively pluck common identifiers
    const runId = (requested as any)?.id || (requested as any)?.run_id || (requested as any)?.runId;
    const status = (requested as any)?.status || (requested as any)?.state || "queued";

    return NextResponse.json({
      id: runId,
      status,
      assistant_id: workflow.assistant_id,
      thread_id: workflow.thread_id || null,
    });
  } catch (error) {
    console.error("Error creating run:", error);
    return NextResponse.json(
      { error: "Failed to create run" },
      { status: 500 }
    );
  }
}
