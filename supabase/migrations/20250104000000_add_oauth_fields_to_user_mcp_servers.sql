-- Add OAuth-related fields to user_mcp_servers table
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS oauth_token TEXT;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE user_mcp_servers ADD COLUMN IF NOT EXISTS refresh_token TEXT;

-- Add index for session_id for faster lookups
CREATE INDEX IF NOT EXISTS user_mcp_servers_session_id_idx ON user_mcp_servers(session_id);