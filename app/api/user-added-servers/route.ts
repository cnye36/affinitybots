import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET - Fetch user's added servers
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: servers, error } = await supabase
      .from('user_added_servers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user added servers:', error);
      return NextResponse.json({ error: "Failed to fetch servers" }, { status: 500 });
    }

    return NextResponse.json({ servers: servers || [] });
  } catch (error) {
    console.error('Error in GET /api/user-added-servers:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add a new server
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { server_slug, display_name, description, url, auth_type = 'none', config = {} } = body;

    if (!server_slug || !url) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: server, error } = await supabase
      .from('user_added_servers')
      .insert({
        user_id: user.id,
        server_slug,
        display_name: display_name || server_slug,
        description: description || `Custom MCP server: ${server_slug}`,
        url,
        auth_type,
        config,
        is_enabled: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user added server:', error);
      return NextResponse.json({ error: "Failed to create server" }, { status: 500 });
    }

    return NextResponse.json({ server });
  } catch (error) {
    console.error('Error in POST /api/user-added-servers:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
