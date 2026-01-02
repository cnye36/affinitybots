-- Migration: Rename qualified_name to server_slug
-- This migration renames the qualified_name column to server_slug across all MCP-related tables
-- The old "qualified_name" terminology came from the Smithery integration which is no longer used

-- Rename column in user_mcp_servers table
ALTER TABLE public.user_mcp_servers
RENAME COLUMN qualified_name TO server_slug;

-- Rename column in global_mcp_servers table (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'global_mcp_servers'
    AND column_name = 'qualified_name'
  ) THEN
    ALTER TABLE public.global_mcp_servers
    RENAME COLUMN qualified_name TO server_slug;
  END IF;
END$$;

-- Rename column in mcp_server_capabilities table
ALTER TABLE public.mcp_server_capabilities
RENAME COLUMN qualified_name TO server_slug;

-- Update unique constraint name in user_mcp_servers (if needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_mcp_servers_user_id_qualified_name_key'
  ) THEN
    ALTER TABLE public.user_mcp_servers
    RENAME CONSTRAINT user_mcp_servers_user_id_qualified_name_key
    TO user_mcp_servers_user_id_server_slug_key;
  END IF;
END$$;

-- Update unique constraint name in mcp_server_capabilities
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mcp_server_capabilities_user_server_unique'
  ) THEN
    -- Drop old constraint
    ALTER TABLE public.mcp_server_capabilities
    DROP CONSTRAINT IF EXISTS mcp_server_capabilities_user_server_unique;

    -- Recreate with new column name
    ALTER TABLE public.mcp_server_capabilities
    ADD CONSTRAINT mcp_server_capabilities_user_server_unique UNIQUE (user_id, server_slug);
  END IF;
END$$;

-- Update indexes
-- Note: PostgreSQL automatically updates indexes when columns are renamed

-- Add comment explaining the change
COMMENT ON COLUMN public.user_mcp_servers.server_slug IS 'Server identifier (slug format). Renamed from qualified_name to remove Smithery terminology.';
COMMENT ON COLUMN public.mcp_server_capabilities.server_slug IS 'Server identifier matching user_mcp_servers.server_slug';
