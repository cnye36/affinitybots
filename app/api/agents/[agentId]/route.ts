import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { Assistant } from "@/types/assistant";
import { SupabaseClient } from "@supabase/supabase-js";

// Helper function to clean up conversations and threads for an assistant
async function cleanupAssistantConversations(supabase: SupabaseClient, assistantId: string) {
  try {
    // Get all conversations for this assistant
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id, thread_id")
      .eq("assistant_id", assistantId);

    if (conversations && conversations.length > 0) {
      console.log(`Deleting ${conversations.length} conversation(s) for assistant ${assistantId}`);

      // Delete threads from LangGraph
      const langgraphClient = new Client({
        apiUrl: process.env.LANGGRAPH_API_URL!,
        apiKey: process.env.LANGSMITH_API_KEY!,
      });

      for (const conv of conversations) {
        if (conv.thread_id) {
          try {
            await langgraphClient.threads.delete(conv.thread_id);
          } catch (error) {
            // Ignore errors - thread may already be deleted
            console.error(`Error deleting thread ${conv.thread_id}:`, error);
          }
        }
      }

      // Delete conversations from database
      const { error: deleteError } = await supabase
        .from("conversations")
        .delete()
        .eq("assistant_id", assistantId);

      if (deleteError) {
        console.error("Error deleting conversations:", deleteError);
      } else {
        console.log(`Deleted conversations for assistant ${assistantId}`);
      }
    }
  } catch (error) {
    console.error("Error in cleanupAssistantConversations:", error);
  }
}

// Helper function to clean up all memories for an assistant
async function cleanupAssistantMemories(supabase: SupabaseClient, assistantId: string) {
  try {
    // Delete all memories for this assistant from the store table
    // Memories can be stored with different prefix formats
    const prefixDot = `user_profile.${assistantId}`;
    const prefixJson = JSON.stringify(["user_profile", assistantId]);
    
    // Use separate delete operations to avoid PostgREST parsing issues with JSON arrays
    const { error: deleteError1 } = await supabase
      .from("store")
      .delete()
      .eq("prefix", prefixDot);
    
    const { error: deleteError2 } = await supabase
      .from("store")
      .delete()
      .eq("prefix", prefixJson);
    
    if (deleteError1 || deleteError2) {
      console.error("Error cleaning up assistant memories:", deleteError1 || deleteError2);
    } else {
      console.log(`Cleaned up memories for assistant ${assistantId}`);
    }
  } catch (error) {
    console.error("Error in cleanupAssistantMemories:", error);
  }
}

// Helper function to clear workflow task assignments when an agent is deleted
async function clearWorkflowTaskAssignments(supabase: SupabaseClient, assistantId: string) {
  try {
    // Find all workflow tasks that use this assistant
    const { data: affectedTasks, error: fetchError } = await supabase
      .from("workflow_tasks")
      .select("workflow_task_id, workflow_id, config")
      .eq("assistant_id", assistantId);

    if (fetchError) {
      console.error("Error fetching affected workflow tasks:", fetchError);
      return;
    }

    if (!affectedTasks || affectedTasks.length === 0) {
      console.log(`No workflow tasks found using assistant ${assistantId}`);
      return;
    }

    console.log(`Clearing ${affectedTasks.length} workflow task(s) that use assistant ${assistantId}`);

    // Track affected workflows
    const affectedWorkflowIds = new Set<string>();

    // Clear each task's configuration
    for (const task of affectedTasks) {
      affectedWorkflowIds.add(task.workflow_id);

      // Create a fresh config with default values, removing agent-specific data
      const clearedConfig = {
        input: {
          source: "previous_node",
          parameters: {},
          prompt: "", // Clear any agent-specific prompt
        },
        output: {
          destination: "next_node",
          format: "json",
        },
        context: {
          thread: { mode: "workflow" },
          useContext: true,
          autoInjectPreviousOutput: true,
        },
        toolApproval: {
          mode: "auto",
          rememberedTools: [],
        },
        // Remove assigned_assistant
        assigned_assistant: null,
      };

      // Update the task with cleared config and null assistant_id
      const { error: updateError } = await supabase
        .from("workflow_tasks")
        .update({
          assistant_id: null,
          config: clearedConfig,
          updated_at: new Date().toISOString(),
        })
        .eq("workflow_task_id", task.workflow_task_id);

      if (updateError) {
        console.error(`Error clearing task ${task.workflow_task_id}:`, updateError);
      }
    }

    // Update workflows.nodes cache to match cleared tasks
    for (const workflowId of affectedWorkflowIds) {
      const { data: workflow } = await supabase
        .from("workflows")
        .select("nodes")
        .eq("workflow_id", workflowId)
        .single();

      if (workflow && workflow.nodes) {
        const nodes = workflow.nodes as any[];
        const cleanedNodes = nodes.map((node) => {
          if (node.type === "task") {
            const assignedAssistantId =
              node.data?.assignedAssistant?.id ||
              node.data?.config?.assigned_assistant?.id;

            // If node references this deleted agent, clear it
            if (assignedAssistantId === assistantId) {
              console.log(`Clearing agent from workflow node: ${node.data.name}`);
              return {
                ...node,
                data: {
                  ...node.data,
                  assignedAssistant: undefined,
                  config: {
                    ...node.data.config,
                    assigned_assistant: null,
                    input: {
                      source: "previous_node",
                      parameters: {},
                      prompt: "",
                    },
                    output: {
                      destination: "next_node",
                      format: "json",
                    },
                  },
                },
              };
            }
          }
          return node;
        });

        await supabase
          .from("workflows")
          .update({
            nodes: cleanedNodes,
            updated_at: new Date().toISOString(),
          })
          .eq("workflow_id", workflowId);
      }
    }

    console.log(`Successfully cleared workflow task assignments for assistant ${assistantId}`);
  } catch (error) {
    console.error("Error in clearWorkflowTaskAssignments:", error);
  }
}

// Helper function to merge configurations safely
function mergeConfigurations(
  currentConfig: any,
  updateConfig: any
): { configurable: Record<string, any> } {
  const currentConfigurable = currentConfig?.configurable || {};
  const updateConfigurable = updateConfig?.configurable || {};

  // Remove selected_tools from both configs (it's only for runtime playground/workflow context)
  const { selected_tools: currentSelectedTools, ...currentWithoutSelectedTools } = currentConfigurable;
  const { selected_tools: updateSelectedTools, ...updateWithoutSelectedTools } = updateConfigurable;

  // Merge configurable properties (excluding selected_tools)
  const mergedConfigurable = {
    ...currentWithoutSelectedTools,
    ...updateWithoutSelectedTools,
  };

  // Ensure arrays exist and normalize types
  if (updateConfigurable.enabled_mcp_servers !== undefined) {
    mergedConfigurable.enabled_mcp_servers = Array.isArray(updateConfigurable.enabled_mcp_servers)
      ? updateConfigurable.enabled_mcp_servers
      : [];
  }

  return { configurable: mergedConfigurable };
}

// Helper function to merge metadata safely
function mergeMetadata(currentMetadata: any, updateMetadata: any) {
  return {
    ...(currentMetadata || {}),
    ...(updateMetadata || {}),
  };
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId: assistantId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: assistant, error } = await supabase
      .from("assistant")
      .select("*")
      .eq("assistant_id", assistantId)
      .eq("metadata->>owner_id", user.id)
      .single();

    if (!assistant || error) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    // Clean up any stale selected_tools from agent config (should not be persisted)
    // This ensures backwards compatibility with old configs that may have selected_tools
    // We'll remove it from the response and let the next save clean it up in the database
    if (assistant.config?.configurable?.selected_tools) {
      const { selected_tools, ...cleanedConfigurable } = assistant.config.configurable;
      assistant.config.configurable = cleanedConfigurable;
    }

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error in GET /api/agents/[agentId]:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId: assistantId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();

    // Get current assistant from database
    const { data: currentAssistant, error: fetchError } = await supabase
      .from("assistant")
      .select("*")
      .eq("assistant_id", assistantId)
      .eq("metadata->>owner_id", user.id)
      .single();

    if (fetchError || !currentAssistant) {
      console.error("Error fetching current assistant:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch current assistant" },
        { status: 500 }
      );
    }

    // Merge configurations and metadata
    const mergedConfig = mergeConfigurations(currentAssistant.config, updateData.config);
    const mergedMetadata = mergeMetadata(currentAssistant.metadata, updateData.metadata);

    // Try LangGraph update first
    const langgraphClient = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      const updatedAssistant = await langgraphClient.assistants.update(assistantId, {
        name: updateData.name || currentAssistant.name,
        metadata: mergedMetadata,
        config: mergedConfig,
      });

      console.log("🎉 LangGraph update successful:", {
        assistant_id: updatedAssistant.assistant_id,
        final_enabled_mcp_servers: mergedConfig.configurable.enabled_mcp_servers
      });

      return NextResponse.json(updatedAssistant);
    } catch (langgraphError) {
      console.error("LangGraph update failed, trying direct database update:", langgraphError);
      
      // Fallback: direct database update
      const { data: updatedAssistant, error: updateError } = await supabase
        .from("assistant")
        .update({
          name: updateData.name || currentAssistant.name,
          metadata: mergedMetadata,
          config: mergedConfig,
        })
        .eq("assistant_id", assistantId)
        .eq("metadata->>owner_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating assistant:", updateError);
        return NextResponse.json(
          { error: "Failed to update assistant" },
          { status: 500 }
        );
      }

      return NextResponse.json(updatedAssistant);
    }
  } catch (error) {
    console.error("Error in PUT /api/agents/[agentId]:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId: assistantId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the assistant belongs to the user
    const { data: assistant, error: fetchError } = await supabase
      .from("assistant")
      .select("assistant_id")
      .eq("assistant_id", assistantId)
      .eq("metadata->>owner_id", user.id)
      .single();

    if (fetchError || !assistant) {
      return NextResponse.json({ error: "Assistant not found" }, { status: 404 });
    }

    // Before deleting, clear workflow task configurations
    // This ensures tasks remain but lose their agent assignment
    await clearWorkflowTaskAssignments(supabase, assistantId);

    // Try LangGraph deletion first
    const langgraphClient = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      await langgraphClient.assistants.delete(assistantId);
      
      // Clean up all memories for this assistant
      await cleanupAssistantMemories(supabase, assistantId);
      
      return NextResponse.json({
        success: true,
        message: "Assistant deleted successfully",
      });
    } catch (langgraphError) {
      console.error("LangGraph deletion failed, trying direct database deletion:", langgraphError);
      
      // Clean up all memories for this assistant before deleting the assistant
      await cleanupAssistantMemories(supabase, assistantId);
      
      // Fallback: direct database deletion
      const { error: deleteError } = await supabase
        .from("assistant")
        .delete()
        .eq("assistant_id", assistantId)
        .eq("metadata->>owner_id", user.id);

      if (deleteError) {
        console.error("Error deleting assistant:", deleteError);
        return NextResponse.json(
          { error: "Failed to delete assistant" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Assistant deleted successfully",
      });
    }
  } catch (error) {
    console.error("Error in DELETE /api/agents/[agentId]:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
} 