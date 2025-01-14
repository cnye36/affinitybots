import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Debug: Log that we're starting the request
  console.log("GET /api/workflows - Starting request");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Debug: Log session status
  if (userError) {
    console.error("GET /api/workflows - Session error:", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user) {
    console.log("GET /api/workflows - No session found");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("GET /api/workflows - User ID:", user.id);

  // Check if we're fetching a single workflow by ID
  const { searchParams } = new URL(request.url);
  const workflowId = searchParams.get("id");

  if (workflowId) {
    console.log("GET /api/workflows - Fetching single workflow:", workflowId);
    // Fetch single workflow
    const { data: workflow, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", workflowId)
      .eq("owner_id", user.id)
      .single();

    if (error) {
      console.error("GET /api/workflows - Error fetching workflow:", error);
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    // Debug: Log successful fetch
    console.log("GET /api/workflows - Successfully fetched workflow");

    // Parse the JSON strings back to objects
    return NextResponse.json({
      ...workflow,
      nodes: workflow.nodes ? JSON.parse(workflow.nodes) : [],
      edges: workflow.edges ? JSON.parse(workflow.edges) : [],
    });
  }

  // Fetch all workflows
  console.log("GET /api/workflows - Fetching all workflows for user:", user.id);
  const { data: workflows, error } = await supabase
    .from("workflows")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("GET /api/workflows - Error fetching workflows:", error);
    return NextResponse.json(
      { error: "Error fetching workflows" },
      { status: 500 }
    );
  }

  // Debug: Log successful fetch
  console.log(
    "GET /api/workflows - Successfully fetched workflows:",
    workflows?.length || 0
  );

  return NextResponse.json({ workflows });
}

export async function POST(req: Request) {
  const supabase = await createClient();

  console.log("POST /api/workflows - Starting request");

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("POST /api/workflows - Auth error:", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();
    console.log("POST /api/workflows - Received data:", {
      name: data.name,
      nodeCount: data.nodes?.length,
    });

    // Validate the required fields
    if (!data.name) {
      return NextResponse.json(
        { error: "Workflow name is required" },
        { status: 400 }
      );
    }

    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return NextResponse.json(
        { error: "At least one node is required" },
        { status: 400 }
      );
    }

    // Prepare the workflow data
    const workflowData = {
      name: data.name,
      nodes: JSON.stringify(data.nodes),
      edges: JSON.stringify(data.edges || []),
      owner_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("POST /api/workflows - Creating workflow for user:", user.id);

    // Create the workflow
    const { data: workflow, error } = await supabase
      .from("workflows")
      .insert([workflowData])
      .select()
      .single();

    if (error) {
      console.error("POST /api/workflows - Error creating workflow:", error);
      return NextResponse.json(
        { error: error.message || "Error creating workflow" },
        { status: 500 }
      );
    }

    console.log(
      "POST /api/workflows - Successfully created workflow:",
      workflow.id
    );

    // Parse the JSON strings back to objects for the response
    return NextResponse.json({
      ...workflow,
      nodes: JSON.parse(workflow.nodes),
      edges: JSON.parse(workflow.edges),
    });
  } catch (error: unknown) {
    console.error("POST /api/workflows - Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error creating workflow",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await req.json();

    // Validate the required fields
    if (!data.id) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    if (!data.name) {
      return NextResponse.json(
        { error: "Workflow name is required" },
        { status: 400 }
      );
    }

    if (!data.nodes || !Array.isArray(data.nodes) || data.nodes.length === 0) {
      return NextResponse.json(
        { error: "At least one node is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("id", data.id)
      .single();

    if (fetchError || !existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (existingWorkflow.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Prepare the workflow data
    const workflowData = {
      name: data.name,
      nodes: JSON.stringify(data.nodes),
      edges: JSON.stringify(data.edges || []),
      updated_at: new Date().toISOString(),
    };

    // Update the workflow
    const { data: workflow, error } = await supabase
      .from("workflows")
      .update(workflowData)
      .eq("id", data.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating workflow:", error);
      return NextResponse.json(
        { error: error.message || "Error updating workflow" },
        { status: 500 }
      );
    }

    // Parse the JSON strings back to objects for the response
    return NextResponse.json({
      ...workflow,
      nodes: JSON.parse(workflow.nodes),
      edges: JSON.parse(workflow.edges),
    });
  } catch (error: unknown) {
    console.error("Error updating workflow:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Error updating workflow",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("DELETE /api/workflows - Unauthorized:", userError);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("id");

    if (!workflowId) {
      return NextResponse.json(
        { error: "Workflow ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership first
    const { data: existingWorkflow, error: fetchError } = await supabase
      .from("workflows")
      .select("owner_id")
      .eq("id", workflowId)
      .single();

    if (fetchError || !existingWorkflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 }
      );
    }

    if (existingWorkflow.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // First, delete associated tasks
    const { error: tasksDeleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("workflow_id", workflowId);

    if (tasksDeleteError) {
      console.error(
        "DELETE /api/workflows - Error deleting tasks:",
        tasksDeleteError
      );
      return NextResponse.json(
        {
          error: `Failed to delete associated tasks: ${tasksDeleteError.message}`,
        },
        { status: 500 }
      );
    }

    // Then delete the workflow
    const { error: workflowDeleteError } = await supabase
      .from("workflows")
      .delete()
      .eq("id", workflowId);

    if (workflowDeleteError) {
      console.error(
        "DELETE /api/workflows - Error deleting workflow:",
        workflowDeleteError
      );
      return NextResponse.json(
        { error: `Failed to delete workflow: ${workflowDeleteError.message}` },
        { status: 500 }
      );
    }

    console.log(
      `DELETE /api/workflows - Successfully deleted workflow ${workflowId}`
    );
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE /api/workflows - Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error deleting workflow",
      },
      { status: 500 }
    );
  }
}