-- Create global MCP servers table for organization-wide servers
CREATE TABLE IF NOT EXISTS global_mcp_servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  qualified_name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS global_mcp_servers_enabled_idx ON global_mcp_servers(is_enabled);
CREATE INDEX IF NOT EXISTS global_mcp_servers_qualified_name_idx ON global_mcp_servers(qualified_name);

-- RLS is optional for global table; leave disabled so all app roles can read
-- If needed, add RLS and service role access only.

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_global_mcp_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_global_mcp_servers_updated_at
  BEFORE UPDATE ON global_mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_global_mcp_servers_updated_at();


