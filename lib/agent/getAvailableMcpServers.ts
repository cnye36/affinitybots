import { createClient } from '@supabase/supabase-js';

/**
 * Loads available MCP servers for a user by merging:
 * - User-specific servers (`user_mcp_servers` where `is_enabled = true`)
 * - Global servers (`global_mcp_servers` where `is_enabled = true`), if table exists
 * - Optional environment-configured servers from GLOBAL_MCP_SERVERS_JSON
 *
 * If a user has a server with the same `qualified_name` as a global server,
 * the user's configuration takes precedence.
 */
export async function getAvailableMcpServers(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const result: Record<string, any> = {};

  // 1) Load enabled user servers
  const { data: userServers, error: userError } = await supabase
    .from('user_mcp_servers')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true);

  if (userError) {
    throw new Error(userError.message);
  }

  for (const server of userServers || []) {
    let serverUrl = server.url;
    // Allow bearer-token injection for servers like HubSpot MCP that expect standard OAuth tokens
    const bearer = server.config?.bearer_token;
    
    console.log(`🔍 Server ${server.qualified_name}:`, {
      url: serverUrl,
      hasBearerToken: !!bearer,
      bearerTokenLength: bearer?.length || 0,
      oauth_token: server.oauth_token ? 'PRESENT' : 'MISSING',
      oauth_token_length: server.oauth_token?.length || 0,
      session_id: server.session_id,
      config: server.config
    });
    
    if (server.oauth_token && server.url) {
      serverUrl = server.url;
    } else if (!serverUrl) {
      // Skip servers without URLs
      console.warn(`Skipping server ${server.qualified_name} for user ${userId}: missing URL`);
      continue;
    }
    
    // Preserve the full server configuration including OAuth tokens and session IDs
    result[server.qualified_name] = {
      url: serverUrl,
      automaticSSEFallback: true,
      oauth_token: server.oauth_token,
      session_id: server.session_id,
      expires_at: server.expires_at,
      refresh_token: server.refresh_token,
      config: server.config,
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined
    };
  }

  // 2) Load global servers from DB (if table exists)
  try {
    const { data: globalServers, error: globalError } = await supabase
      .from('global_mcp_servers')
      .select('*')
      .eq('is_enabled', true);

    if (!globalError) {
      for (const server of globalServers || []) {
        // Skip if user already has an override
        if (result[server.qualified_name]) continue;
        if (!server.url) continue;
        result[server.qualified_name] = {
          url: server.url,
          automaticSSEFallback: false,
          config: server.config
        };
      }
    }
  } catch {
    // Table may not exist yet; ignore
  }

  // 3) Load optional global servers from env JSON
  try {
    const envJson = process.env.GLOBAL_MCP_SERVERS_JSON;
    if (envJson) {
      const envServers: Array<{ qualified_name: string; url: string; is_enabled?: boolean }>
        = JSON.parse(envJson);
      for (const server of envServers) {
        if (server.is_enabled === false) continue;
        if (!server.qualified_name || !server.url) continue;
        if (result[server.qualified_name]) continue; // user/DB global override
        result[server.qualified_name] = {
          url: server.url,
          automaticSSEFallback: false
        };
      }
    }
  } catch {
    // Ignore malformed env
  }

  return result;
}


