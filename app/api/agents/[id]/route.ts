import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

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

    // First verify the assistant exists and user has access
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", params.id)
      .single();

    if (userAssistantError || !userAssistant) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    // Then fetch the full assistant details
    const { data: assistant, error: assistantError } = await supabase
      .from("assistant")
      .select("*")
      .eq("assistant_id", params.id)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json(
        { error: "Failed to fetch assistant details" },
        { status: 500 }
      );
    }

    return NextResponse.json(assistant);
  } catch (error) {
    console.error("Error fetching assistant:", error);
    return NextResponse.json(
      { error: "Failed to fetch assistant" },
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

    // First verify the assistant exists and user has access
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", params.id)
      .single();

    if (userAssistantError || !userAssistant) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Update the assistant
    const { data: updatedAssistant, error: updateError } = await supabase
      .from("assistant")
      .update({
        name: body.name,
        description: body.description,
        metadata: body.metadata,
        config: body.config,
      })
      .eq("assistant_id", params.id)
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
  } catch (error) {
    console.error("Error updating assistant:", error);
    return NextResponse.json(
      { error: "Failed to update assistant" },
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

    // First verify the assistant exists and user has access
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from("user_assistants")
      .select("assistant_id")
      .eq("user_id", user.id)
      .eq("assistant_id", params.id)
      .single();

    if (userAssistantError || !userAssistant) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    // Delete the assistant
    const { error: deleteError } = await supabase
      .from("assistant")
      .delete()
      .eq("assistant_id", params.id);

    if (deleteError) {
      console.error("Error deleting assistant:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete assistant" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Assistant deleted successfully" });
  } catch (error) {
    console.error("Error deleting assistant:", error);
    return NextResponse.json(
      { error: "Failed to delete assistant" },
      { status: 500 }
    );
  }
}
