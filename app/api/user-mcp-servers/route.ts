import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// GET: List all MCP servers for the user
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const sanitized = (data || []).map((server) => {
    const { oauth_token, refresh_token, ...rest } = server as any;
    return {
      ...rest,
      has_oauth_token: Boolean(oauth_token),
      has_refresh_token: Boolean(refresh_token),
    };
  });

  return NextResponse.json({ servers: sanitized });
}

// POST: Add a new MCP server config for the user
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { qualified_name, config, url, is_enabled = false } = await request.json();
  if (!qualified_name) {
    return NextResponse.json({ error: "Missing qualified_name" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .insert([{ user_id: user.id, qualified_name, config: config || {}, url: url || null, is_enabled }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ server: data });
}

// PUT: Update an existing MCP server config
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, config } = await request.json();
  if (!id || !config) {
    return NextResponse.json({ error: "Missing id or config" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ server: data });
}

// DELETE: Remove a user's MCP server config
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const { error } = await supabase
    .from("user_mcp_servers")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
