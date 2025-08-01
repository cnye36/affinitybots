import { createClient } from '@supabase/supabase-js';

/**
 * Checks if a server is a Smithery-hosted server
 */
function isSmitheryServer(server: any): boolean {
  // Check if explicitly marked as Smithery server
  if (server.config?.provider === 'smithery') {
    return true;
  }
  
  // Check if URL is a Smithery URL
  if (server.url?.includes('server.smithery.ai')) {
    return true;
  }
  
  // For legacy support, assume servers without URLs but with Smithery config are Smithery servers
  if (!server.url && (server.config?.smitheryProfileId || server.config?.profileId)) {
    return true;
  }
  
  return false;
}

export async function getUserMcpServers(userId: string) {
  // Use service role client for LangGraph Studio (no cookies needed)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  console.log(`🔍 getUserMcpServers: Querying for user ${userId}`);
  
  // First, check all servers for this user (enabled and disabled)
  const { data: allUserServers, error: allError } = await supabase
    .from("user_mcp_servers")
    .select("*")
    .eq("user_id", userId);
  
  if (allError) {
    console.error(`❌ Error querying all servers for user ${userId}:`, allError.message);
    throw new Error(allError.message);
  }
  
  console.log(`📊 Total servers for user ${userId}: ${allUserServers?.length || 0}`);
  if (allUserServers && allUserServers.length > 0) {
    allUserServers.forEach(server => {
      console.log(`  - ${server.qualified_name} (enabled: ${server.is_enabled}, url: ${server.url ? 'has URL' : 'no URL'}, oauth: ${server.oauth_token ? 'has token' : 'no token'})`);
    });
  }
  
  // Now get only enabled servers
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_enabled", true); // Only fetch enabled servers

  if (error) {
    console.error(`❌ Error querying enabled servers for user ${userId}:`, error.message);
    throw new Error(error.message);
  }

  console.log(`✅ getUserMcpServers: Found ${data?.length || 0} enabled servers for user ${userId}`);
  console.log(`Enabled server names:`, data?.map(s => s.qualified_name) || []);

  // Transform to mcpServers object with OAuth session URLs or fallback to API key URLs
  const mcpServers: Record<string, any> = {};
  
  for (const server of data) {
    try {
      console.log(`🔧 Processing server: ${server.qualified_name}`);
      console.log(`   Database URL: ${server.url || 'not set'}`);
      console.log(`   OAuth Token: ${server.oauth_token ? 'present' : 'not set'}`);
      console.log(`   Session ID: ${server.session_id || 'not set'}`);
      console.log(`   Config: ${JSON.stringify(server.config || {})}`);
      
      let serverUrl = server.url;
      
      // Check if this is an OAuth connection with session URL
      if (server.oauth_token && server.url) {
        console.log(`🔐 Using OAuth session URL: ${server.url}`);
        serverUrl = server.url;
        
        // Check if token is expired
        if (server.expires_at) {
          const expiryDate = new Date(server.expires_at);
          if (expiryDate < new Date()) {
            console.warn(`⚠️  OAuth token expired for ${server.qualified_name}, connection may fail`);
          }
        }
      } 
      // For non-OAuth servers, use the configured URL
      else if (serverUrl) {
        console.log(`📁 Using configured URL: ${serverUrl}`);
      }
      // Fallback for Smithery servers without explicit URLs (legacy support)
      else {
        const apiKey = process.env.SMITHERY_API_KEY;
        const isSmitheryServerResult = isSmitheryServer(server);
        
        if (isSmitheryServerResult && apiKey) {
          // Build fallback URL for Smithery servers
          const profile = server.config?.smitheryProfileId || server.config?.profileId || "eligible-bug-FblvFg";
          serverUrl = `https://server.smithery.ai/${server.qualified_name}/mcp?api_key=${apiKey}&profile=${profile}`;
          console.log(`🏗️  Built Smithery fallback URL: ${serverUrl.replace(apiKey, 'HIDDEN_API_KEY')}`);
        } else {
          console.warn(`❌ Server ${server.qualified_name} has no URL configured and cannot connect`);
          continue;
        }
      }
      
      mcpServers[server.qualified_name] = {
        url: serverUrl,
        // Don't specify transport - let MultiServerMCPClient auto-detect
        automaticSSEFallback: false
      };
      
      console.log(`✅ Added server ${server.qualified_name} to mcpServers`);
    } catch (err) {
      console.error(`❌ Failed to create connection config for ${server.qualified_name}:`, err);
      // Skip this server if there's an error
    }
  }
  
  return mcpServers;
}