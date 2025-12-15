import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { generateAgentConfiguration } from "@/lib/agent/agentGeneration";
import { Client } from "@langchain/langgraph-sdk";
import { legacyModelToLlmId } from "@/lib/llm/catalog";

// Helper function to create a timeout promise
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

export async function POST(request: Request) {
  try {
    // Add overall timeout protection for the entire request
    const result = await Promise.race([
      (async () => {
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { prompt, preferredName, enabledMCPServers } = await request.json();

        if (!prompt) {
          return NextResponse.json(
            { error: "Missing required field: prompt" },
            { status: 400 }
          );
        }

        // Generate the agent configuration with avatar generation
        const generatedConfig = await generateAgentConfiguration(prompt, user.id, {
          preferredName,
          selectedTools: Array.isArray(enabledMCPServers) ? enabledMCPServers : [],
        });

        // Create LangGraph Platform assistant
        const langgraphClient = new Client({
          apiUrl: process.env.LANGGRAPH_API_URL!,
          apiKey: process.env.LANGSMITH_API_KEY!,
        });

        // Create assistant with proper configuration
        const assistant = await langgraphClient.assistants.create({
          graphId: "reactAgent", // Use the same graph for all assistants
          name: generatedConfig.name,
          config: {
            configurable: {
              user_id: user.id,
              model: generatedConfig.model,
              llm: legacyModelToLlmId(generatedConfig.model) || `openai:${generatedConfig.model}`,
              tools: generatedConfig.tools,
              memory: generatedConfig.memory,
              prompt_template: generatedConfig.instructions,
              knowledge_base: {
                isEnabled: generatedConfig.knowledge.enabled,
                config: { sources: [] },
              },
              enabled_mcp_servers: Array.isArray(enabledMCPServers)
                ? enabledMCPServers
                : [],
            },
          },
          metadata: {
            owner_id: user.id,
            description: generatedConfig.description,
            agent_avatar: generatedConfig.agent_avatar,
          },
        });

        // Update the assistant configuration with the actual assistant_id
        const updatedAssistant = await langgraphClient.assistants.update(assistant.assistant_id, {
          config: {
            configurable: {
              ...assistant.config.configurable,
              assistant_id: assistant.assistant_id,
            },
          },
        });

        // Create user-assistant mapping for access control
        const { error: mappingError } = await supabase
          .from("user_assistants")
          .upsert({
            user_id: user.id,
            assistant_id: assistant.assistant_id,
          }, {
            onConflict: 'user_id,assistant_id',
            ignoreDuplicates: true
          });

        if (mappingError) {
          console.error("Error creating user-assistant mapping:", mappingError);
          // Note: Assistant is already created in DB via LangGraph platform
        }

        return NextResponse.json({
          success: true,
          assistant: updatedAssistant,
        });
      })(),
      createTimeoutPromise(120000) // 2 minute timeout for entire request
    ]);

    return result;
  } catch (error) {
    console.error("Error creating assistant:", error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create assistant" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[${requestId}] GET /api/agents - Request started`);
  
  try {
    // Add timeout protection for GET request
    const result = await Promise.race([
      (async () => {
        console.log(`[${requestId}] GET /api/agents - Authenticating user`);
        const supabase = await createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.log(`[${requestId}] GET /api/agents - Unauthorized`);
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log(`[${requestId}] GET /api/agents - User authenticated: ${user.id}`);

        // Get user's assistants directly from LangGraph platform (which uses same database)
        const langgraphClient = new Client({
          apiUrl: process.env.LANGGRAPH_API_URL!,
          apiKey: process.env.LANGSMITH_API_KEY!,
        });

        try {
          console.log(`[${requestId}] GET /api/agents - Fetching from LangGraph API`);
          // Get assistants owned by this user
          const assistants = await langgraphClient.assistants.search({
            metadata: { owner_id: user.id },
            limit: 100,
          });

          console.log(`[${requestId}] GET /api/agents - Successfully fetched ${assistants?.length || 0} assistants`);
          return NextResponse.json({
            assistants: assistants || [],
          });
        } catch (langgraphError) {
          console.error(`[${requestId}] LangGraph API error, falling back to direct database query:`, langgraphError);
          
          // Fallback: direct database query if LangGraph API is temporarily unavailable
          try {
            console.log(`[${requestId}] GET /api/agents - Using fallback database query`);
            const { data, error: queryError } = await supabase
              .from("assistant")
              .select(`
                *,
                user_assistants!inner(user_id)
              `)
              .eq("user_assistants.user_id", user.id)
              .order("created_at", { ascending: false });
            
            if (queryError) {
              console.error(`[${requestId}] Error fetching assistants from database:`, queryError);
              return NextResponse.json(
                { error: "Failed to fetch assistants" },
                { status: 500 }
              );
            }

            console.log(`[${requestId}] GET /api/agents - Fallback query successful: ${data?.length || 0} assistants`);
            return NextResponse.json({
              assistants: data || [],
            });
          } catch (fallbackError) {
            console.error(`[${requestId}] Fallback query failed:`, fallbackError);
            return NextResponse.json(
              { error: "Failed to fetch assistants" },
              { status: 500 }
            );
          }
        }
      })(),
      createTimeoutPromise(30000) // 30 second timeout for GET request
    ]);

    console.log(`[${requestId}] GET /api/agents - Request completed successfully`);
    return result;
  } catch (error) {
    console.error(`[${requestId}] Error in GET /api/agents:`, error);
    
    // Check if it's a timeout error
    if (error instanceof Error && error.message.includes('timed out')) {
      return NextResponse.json(
        { error: "Request timed out. Please try again." },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to fetch assistants" },
      { status: 500 }
    );
  }
} 