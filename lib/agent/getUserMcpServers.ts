import { createClient } from "@/supabase/server";

export async function getUserMcpServers(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_mcp_servers")
    .select("*")
    .eq("user_id", userId)
    .eq("is_enabled", true); // Only fetch enabled servers

  if (error) throw new Error(error.message);

  console.log(`getUserMcpServers: Found ${data?.length || 0} enabled servers for user ${userId}`);
  console.log(`Enabled server names:`, data?.map(s => s.qualified_name) || []);

  // Transform to mcpServers object with Smithery server configurations
  const mcpServers: Record<string, any> = {};
  
  for (const server of data) {
    try {
      // Get the Smithery API key
      const apiKey = process.env.SMITHERY_API_KEY;
      if (!apiKey) {
        console.warn(`Smithery API key not configured, skipping server: ${server.qualified_name}`);
        continue;
      }

      // Create Smithery server configuration for MultiServerMCPClient
      // This will be used with StreamableHTTPClientTransport via Smithery SDK
      mcpServers[server.qualified_name] = {
        url: `https://server.smithery.ai/${server.qualified_name}`,
        transport: "streamable_http",
        config: server.config || {},
        apiKey: apiKey
      };
    } catch (err) {
      console.error(`Failed to create connection config for ${server.qualified_name}:`, err);
      // Skip this server if there's an error
    }
  }
  
  return mcpServers;
}