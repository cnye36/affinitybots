import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { generateAgentConfiguration } from "@/lib/agent/agent-generation";

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

    // Generate the agent configuration with avatar generation
    const generatedConfig = await generateAgentConfiguration(
      prompt,
      agentType,
      user.id // Pass user ID for avatar generation
    );

    // Structure the agent data for database insertion
    const agentData = {
      name: generatedConfig.name,
      description: generatedConfig.description,
      agent_avatar: generatedConfig.agent_avatar, // Use generated avatar
      user_id: user.id,
      metadata: {
        owner_id: user.id,
      },
      config: {
        model: generatedConfig.model,
        temperature: generatedConfig.temperature,
        tools: generatedConfig.tools,
        memory: generatedConfig.memory,
        prompt_template: generatedConfig.instructions,
        knowledge_base: {
          isEnabled: generatedConfig.knowledge.enabled,
          config: { sources: [] },
        },
        enabled_mcp_servers: [], // Start with no tools enabled
        agentId: user.id,
      },
    };

    // Create agent in the database
    const { data: agent, error: insertError } = await supabase
      .from("agent")
      .insert(agentData)
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting agent:", insertError);
      throw new Error("Failed to create agent");
    }

    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
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
