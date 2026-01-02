import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ serverSlug: string }> }
) {
  const params = await props.params;
  const { serverSlug } = params;

  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get server configuration from Supabase
    const { data, error } = await supabase
      .from('user_mcp_servers')
      .select('server_slug, config, is_enabled, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('server_slug', decodeURIComponent(serverSlug))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No configuration found - return 200 with empty config instead of 404
        return NextResponse.json({ 
          server: null,
          config: null,
          configured: false
        }, { status: 200 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      server: data,
      config: data.config,
      configured: true
    });
  } catch (error) {
    console.error('Error fetching server configuration:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ serverSlug: string }> }
) {
  const params = await props.params;
  const { serverSlug } = params;

  try {
    const body = await request.json();
    const { config, isEnabled = true } = body;

    // Validate that config is an object
    if (config && typeof config !== 'object') {
      return NextResponse.json({ error: 'Config must be an object' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Upsert the configuration
    const { data, error } = await supabase
      .from('user_mcp_servers')
      .upsert({
        user_id: user.id,
        server_slug: decodeURIComponent(serverSlug),
        config: config,
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      server: data
    });
  } catch (error) {
    console.error('Error saving server configuration:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ serverSlug: string }> }
) {
  const params = await props.params;
  const { serverSlug } = params;

  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { data, error } = await supabase
      .from('user_mcp_servers')
      .delete()
      .eq('user_id', user.id)
      .eq('server_slug', decodeURIComponent(serverSlug))
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      deleted: data
    });
  } catch (error) {
    console.error('Error deleting server configuration:', error);
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 });
  }
} 