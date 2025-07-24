-- Create user_mcp_servers table
CREATE TABLE IF NOT EXISTS user_mcp_servers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qualified_name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, qualified_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS user_mcp_servers_user_id_idx ON user_mcp_servers(user_id);
CREATE INDEX IF NOT EXISTS user_mcp_servers_qualified_name_idx ON user_mcp_servers(qualified_name);
CREATE INDEX IF NOT EXISTS user_mcp_servers_user_qualified_idx ON user_mcp_servers(user_id, qualified_name);

-- Enable Row Level Security
ALTER TABLE user_mcp_servers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own MCP servers"
  ON user_mcp_servers
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MCP servers"
  ON user_mcp_servers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MCP servers"
  ON user_mcp_servers
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own MCP servers"
  ON user_mcp_servers
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_mcp_servers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_mcp_servers_updated_at
  BEFORE UPDATE ON user_mcp_servers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_mcp_servers_updated_at(); 