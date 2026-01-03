import { createClient } from '@supabase/supabase-js';

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
      console.log(`  - ${server.server_slug} (enabled: ${server.is_enabled}, url: ${server.url ? 'has URL' : 'no URL'}, oauth: ${server.oauth_token ? 'has token' : 'no token'})`);
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
  console.log(`Enabled server names:`, data?.map(s => s.server_slug) || []);

  // Transform to mcpServers object with OAuth session URLs or fallback to API key URLs
  const mcpServers: Record<string, any> = {};
  
  for (const server of data) {
    try {
      console.log(`🔧 Processing server: ${server.server_slug}`);
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
            console.warn(`⚠️  OAuth token expired for ${server.server_slug}, connection may fail`);
          }
        }
      } 
      // For non-OAuth servers, use the configured URL
      else if (serverUrl) {
        console.log(`📁 Using configured URL: ${serverUrl}`);
      }
      // Skip servers without URLs
      else {
        console.warn(`❌ Server ${server.server_slug} has no URL configured and cannot connect`);
        continue;
      }
      
      mcpServers[server.server_slug] = {
        url: serverUrl,
        // Don't specify transport - let MultiServerMCPClient auto-detect
        automaticSSEFallback: false
      };
      
      console.log(`✅ Added server ${server.server_slug} to mcpServers`);
    } catch (err) {
      console.error(`❌ Failed to create connection config for ${server.server_slug}:`, err);
      // Skip this server if there's an error
    }
  }
  
  return mcpServers;
}