import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// PUT - Update a server
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, description, url, auth_type, config, is_enabled } = body;
    const { id } = await params;

    const { data: server, error } = await supabase
      .from('user_added_servers')
      .update({
        display_name,
        description,
        url,
        auth_type,
        config,
        is_enabled,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user added server:', error);
      return NextResponse.json({ error: "Failed to update server" }, { status: 500 });
    }

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Error in PUT /api/user-added-servers/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a server
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { error } = await supabase
      .from('user_added_servers')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting user added server:', error);
      return NextResponse.json({ error: "Failed to delete server" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/user-added-servers/[id]:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
