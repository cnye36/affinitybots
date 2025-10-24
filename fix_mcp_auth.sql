-- Fix Google Drive MCP server URL for Docker networking
-- Run this to update the URL in the database

-- First, let's see what we have
SELECT 
  user_id,
  qualified_name,
  url,
  expires_at,
  is_enabled,
  session_id,
  oauth_token IS NOT NULL as has_token,
  refresh_token IS NOT NULL as has_refresh_token
FROM user_mcp_servers 
WHERE qualified_name IN ('google-drive', 'github', 'hubspot');

-- Update Google Drive URL to use Docker networking
UPDATE user_mcp_servers 
SET url = 'http://host.docker.internal:3002',
    updated_at = NOW()
WHERE qualified_name = 'google-drive' 
  AND url = 'http://localhost:3002';

-- Verify the update
SELECT 
  user_id,
  qualified_name,
  url,
  expires_at,
  is_enabled
FROM user_mcp_servers 
WHERE qualified_name = 'google-drive';
