import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";
import { Assistant } from "@/types/assistant";

// Helper function to merge configurations safely
function mergeConfigurations(
  currentConfig: any,
  updateConfig: any
): { configurable: Record<string, any> } {
  const currentConfigurable = currentConfig?.configurable || {};
  const updateConfigurable = updateConfig?.configurable || {};

  // Merge configurable properties
  const mergedConfigurable = {
    ...currentConfigurable,
    ...updateConfigurable,
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
  props: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await props.params;
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

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error in GET /api/assistants/[assistantId]:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await props.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();
    
    console.log("🔍 Received update data:", {
      name: updateData.name,
      configurable: updateData.config?.configurable,
    });

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
    console.error("Error in PUT /api/assistants/[assistantId]:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await props.params;
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

    // Try LangGraph deletion first
    const langgraphClient = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      await langgraphClient.assistants.delete(assistantId);
      
      return NextResponse.json({
        success: true,
        message: "Assistant deleted successfully",
      });
    } catch (langgraphError) {
      console.error("LangGraph deletion failed, trying direct database deletion:", langgraphError);
      
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
    console.error("Error in DELETE /api/assistants/[assistantId]:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
} 