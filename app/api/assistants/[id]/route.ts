import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First verify the assistant exists and user has access
    const { data: userAssistant, error: userAssistantError } = await supabase
      .from('user_assistants')
      .select('assistant_id')
      .eq('user_id', user.id)
      .eq('assistant_id', params.id)
      .single();

    if (userAssistantError || !userAssistant) {
      return NextResponse.json(
        { error: "Assistant not found or access denied" },
        { status: 404 }
      );
    }

    // Then fetch the full assistant details
    const { data: assistant, error: assistantError } = await supabase
      .from('assistant')
      .select('*')
      .eq('assistant_id', params.id)
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