import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/client";
import { getUserId } from "@/lib/auth"; // You should implement this to extract user id from session/jwt

// GET: List all MCP servers for the user
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ servers: data });
}

// POST: Add a new MCP server config for the user
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { qualified_name, config } = await request.json();
  if (!qualified_name || !config) {
    return NextResponse.json({ error: "Missing qualified_name or config" }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .insert([{ user_id: userId, qualified_name, config }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ server: data });
}

// PUT: Update an existing MCP server config
export async function PUT(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id, config } = await request.json();
  if (!id || !config) {
    return NextResponse.json({ error: "Missing id or config" }, { status: 400 });
  }
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ server: data });
}

// DELETE: Remove a user's MCP server config
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("user_mcp_servers")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}