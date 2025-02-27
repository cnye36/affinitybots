import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { generateAgentConfiguration } from "@/lib/langchain/agent/agent-generation";
import { Client } from "@langchain/langgraph-sdk";


export async function POST(request: Request) {
  const client = new Client({
    apiUrl: process.env.LANGGRAPH_URL,
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

    const { prompt, agentType } = await request.json();

    if (!prompt || !agentType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate the agent configuration
    const config = await generateAgentConfiguration(prompt, agentType, user.id);

    // Create assistant in LangGraph
    const assistant = await client.assistants.create({
      graphId: "agent",
      name: config.name,
      metadata: {
        ...config.metadata,
        owner_id: user.id,
      },
      config: {
        configurable: {
          ...config.configurable,
        },
      },
    });

    return NextResponse.json({
      success: true,
      assistant,
    });
  } catch (error) {
    console.error("Error creating assistant:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create assistant",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query assistants through the user_assistants junction table
    const { data: assistants, error } = await supabase
      .from('user_assistants')
      .select(`
        assistant:assistant (*)
      `)
      .eq('user_id', user.id);

    if (error) throw error;

    // Extract just the assistant data from the joined results
    const formattedAssistants = assistants?.map(ua => ua.assistant) || [];
    
    return NextResponse.json(formattedAssistants);
  } catch (error) {
    console.error("Error in GET handler:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
}
