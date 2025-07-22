import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import logger from "@/lib/logger";

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify the agent exists and user has access
    const { data: userAgent, error: userAgentError } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", user.id)
      .eq("agent_id", params.id)
      .single();

    if (userAgentError || !userAgent) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Then fetch the full agent details
    const { data: agent, error: agentError } = await supabase
      .from("agent")
      .select("*")
      .eq("id", params.id)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        { error: "Failed to fetch agent details" },
        { status: 500 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    logger.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify the agent exists and user has access
    const { data: userAgent, error: userAgentError } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", user.id)
      .eq("agent_id", params.id)
      .single();

    if (userAgentError || !userAgent) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Update the agent
    const { data: updatedAgent, error: updateError } = await supabase
      .from("agent")
      .update({
        name: body.name,
        description: body.description,
        agent_avatar: body.agent_avatar,
        metadata: body.metadata,
        config: body.config,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error updating agent:", updateError);
      return NextResponse.json(
        { error: "Failed to update agent" },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedAgent);
  } catch (error) {
    logger.error("Error updating agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify the agent exists and user has access
    const { data: userAgent, error: userAgentError } = await supabase
      .from("user_agents")
      .select("agent_id")
      .eq("user_id", user.id)
      .eq("agent_id", params.id)
      .single();

    if (userAgentError || !userAgent) {
      return NextResponse.json(
        { error: "Agent not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the agent
    const { error: deleteError } = await supabase
      .from("agent")
      .delete()
      .eq("id", params.id);

    if (deleteError) {
      logger.error("Error deleting agent:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete agent" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    logger.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
