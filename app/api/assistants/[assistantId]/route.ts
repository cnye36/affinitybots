import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { Client } from "@langchain/langgraph-sdk";

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

    // Update assistant via LangGraph platform (will update the database directly)
    const langgraphClient = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      // First, get the current assistant from database to preserve existing configuration
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

      console.log("🔍 Current assistant config:", {
        current_enabled_mcp_servers: currentAssistant.config?.configurable?.enabled_mcp_servers,
        current_config: currentAssistant.config
      });

      // Ensure we have valid configuration objects
      const currentConfig = currentAssistant.config || {};
      const currentConfigurable = currentConfig.configurable || {};
      const updateConfig = updateData.config || {};
      const updateConfigurable = updateConfig.configurable || {};

      // Back-compat: convert any top-level config keys into configurable
      const topLevelToConfigurable: Record<string, any> = {};
      const possibleKeys = [
        "model",
        "temperature",
        "tools",
        "memory",
        "prompt_template",
        "knowledge_base",
      ] as const;
      for (const key of possibleKeys) {
        if (Object.prototype.hasOwnProperty.call(updateConfig, key)) {
          topLevelToConfigurable[key] = (updateConfig as any)[key];
        }
      }

      console.log("🔄 Merging configurations:", {
        update_enabled_mcp_servers: updateConfig.enabled_mcp_servers,
        current_configurable: currentConfigurable,
        update_configurable: updateConfigurable
      });

      // Merge the existing configurable properties with incoming updates (nested-only contract)
      const mergedConfigurable: Record<string, any> = {
        ...currentConfigurable,
        ...updateConfigurable,
        ...topLevelToConfigurable,
      };
      // Ensure arrays/objects exist and normalize types
      mergedConfigurable.enabled_mcp_servers = Array.isArray(updateConfigurable.enabled_mcp_servers)
        ? updateConfigurable.enabled_mcp_servers
        : Array.isArray(updateConfig.enabled_mcp_servers)
          ? updateConfig.enabled_mcp_servers
          : Array.isArray(currentConfigurable.enabled_mcp_servers)
            ? currentConfigurable.enabled_mcp_servers
            : [];

      const mergedConfig = {
        configurable: mergedConfigurable,
      };

      console.log("✅ Merged config result:", {
        final_enabled_mcp_servers: mergedConfig.configurable.enabled_mcp_servers,
        merged_config: mergedConfig
      });

      // Merge metadata as well, ensuring we preserve existing metadata
      const currentMetadata = currentAssistant.metadata || {};
      const updateMetadata = updateData.metadata || {};
      const mergedMetadata = {
        ...currentMetadata,
        ...updateMetadata,
      };

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
      
      // Fallback: direct database update with config merging
      try {
        // Get current assistant from database (already done above, but doing it again for fallback)
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

        // Ensure we have valid configuration objects for fallback
        const currentConfig = currentAssistant.config || {};
        const currentConfigurable = currentConfig.configurable || {};
        const updateConfig = updateData.config || {};
        const updateConfigurable = updateConfig.configurable || {};

        // Merge configurations
        const mergedConfig = {
          configurable: {
            ...currentConfigurable,
            ...updateConfigurable,
          },
        } as const;

        // Merge metadata
        const currentMetadata = currentAssistant.metadata || {};
        const updateMetadata = updateData.metadata || {};
        const mergedMetadata = {
          ...currentMetadata,
          ...updateMetadata,
        };

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
      } catch (fallbackError) {
        console.error("Fallback update failed:", fallbackError);
        return NextResponse.json(
          { error: "Failed to update assistant" },
          { status: 500 }
        );
      }
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

    // Delete assistant via LangGraph Platform (will delete from database directly)
    const langgraphClient = new Client({
      apiUrl: process.env.LANGGRAPH_API_URL!,
      apiKey: process.env.LANGSMITH_API_KEY!,
    });

    try {
      // Delete the assistant from LangGraph Platform (handles database deletion)
      await langgraphClient.assistants.delete(assistantId);

      // Clean up user-assistant mapping if it exists
      await supabase
        .from("user_assistants")
        .delete()
        .eq("assistant_id", assistantId)
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        message: "Assistant deleted successfully",
      });
    } catch (langgraphError) {
      console.error("LangGraph deletion failed, trying direct database cleanup:", langgraphError);
      
      // Fallback: direct database deletion
      try {
        const { error: deleteError } = await supabase
          .from("assistant")
          .delete()
          .eq("assistant_id", assistantId)
          .eq("metadata->>owner_id", user.id);

        if (deleteError) {
          console.error("Error deleting assistant record:", deleteError);
          return NextResponse.json(
            { error: "Failed to delete assistant record" },
            { status: 500 }
          );
        }

        // Also clean up user-assistant mapping
        await supabase
          .from("user_assistants")
          .delete()
          .eq("assistant_id", assistantId)
          .eq("user_id", user.id);

        return NextResponse.json({
          success: true,
          message: "Assistant deleted successfully",
        });
      } catch (fallbackError) {
        console.error("Fallback deletion failed:", fallbackError);
        return NextResponse.json(
          { error: "Failed to delete assistant" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Error in DELETE /api/assistants/[assistantId]:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
} 