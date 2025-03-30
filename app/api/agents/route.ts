import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { generateAgentConfiguration } from "@/lib/langchain/agent/agent-generation";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { prompt, agentType } = await request.json();

    if (!prompt || !agentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate the agent configuration
    const agentConfig = await generateAgentConfiguration(
      prompt,
      agentType,
      user.id
    );

    // Create agent in the database
    const { data: agent, error: insertError } = await supabase
      .from("agent")
      .insert({
        name: agentConfig.name,
        description: agentConfig.description,
        agent_avatar: agentConfig.agent_avatar,
        metadata: agentConfig.metadata,
        config: agentConfig.config,
        user_id: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting agent:", insertError);
      throw new Error("Failed to create agent");
    }

    // Create user-agent relationship
    const { error: relationError } = await supabase.from("user_agents").insert({
      user_id: user.id,
      agent_id: agent.id,
    });

    if (relationError) {
      console.error("Error creating user-agent relationship:", relationError);
      // Rollback agent creation
      await supabase.from("agent").delete().eq("id", agent.id);
      throw new Error("Failed to create user-agent relationship");
    }

    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create agent",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query agents through the user_agents junction table
    const { data: agents, error } = await supabase
      .from("user_agents")
      .select(
        `
        agent:agent_id (
          id,
          name,
          agent_avatar,
          description,
          metadata,
          config,
          created_at,
          updated_at
        )
      `
      )
      .eq("user_id", user.id);

    if (error) throw error;

    // Extract just the agent data from the joined results
    const formattedAgents = agents?.map((ua) => ua.agent) || [];

    return NextResponse.json(formattedAgents);
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}
