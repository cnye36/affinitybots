import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { qualifiedName: string } }
) {
  const { qualifiedName } = params;
  
  try {
    const supabase = await createClient();
    
    // Get server configuration from Supabase
    const { data, error } = await supabase
      .from('user_mcp_servers')
      .select('qualified_name, config_json, is_enabled, created_at, updated_at')
      .eq('qualified_name', decodeURIComponent(qualifiedName))
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      server: data,
      config: data.config_json 
    });
  } catch (error) {
    console.error('Error fetching server configuration:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { qualifiedName: string } }
) {
  const { qualifiedName } = params;
  
  try {
    const body = await request.json();
    const { config, isEnabled = true } = body;

    // Validate that config is an object
    if (config && typeof config !== 'object') {
      return NextResponse.json({ error: 'Config must be an object' }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Upsert the configuration
    const { data, error } = await supabase
      .from('user_mcp_servers')
      .upsert({
        qualified_name: decodeURIComponent(qualifiedName),
        config_json: config,
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
  { params }: { params: { qualifiedName: string } }
) {
  const { qualifiedName } = params;
  
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_mcp_servers')
      .delete()
      .eq('qualified_name', decodeURIComponent(qualifiedName))
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