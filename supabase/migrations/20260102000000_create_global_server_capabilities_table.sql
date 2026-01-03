-- Create table for storing global/server-level MCP server capabilities
-- This stores capabilities discovered from servers that are shared across all users
-- (as opposed to user-specific capabilities which may vary)
CREATE TABLE IF NOT EXISTS public.global_server_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_slug TEXT NOT NULL UNIQUE,
  
  -- Discovered capabilities (stored as JSONB for flexibility)
  tools JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  prompts JSONB DEFAULT '[]'::jsonb,
  
  -- Server metadata
  server_info JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS global_server_capabilities_server_slug_idx
  ON public.global_server_capabilities(server_slug);

CREATE INDEX IF NOT EXISTS global_server_capabilities_discovered_at_idx
  ON public.global_server_capabilities(discovered_at DESC);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_global_server_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_global_server_capabilities_updated_at
  BEFORE UPDATE ON public.global_server_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_global_server_capabilities_updated_at();

-- RLS: Allow all authenticated users to read (capabilities are public info)
ALTER TABLE public.global_server_capabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view global server capabilities"
  ON public.global_server_capabilities
  FOR SELECT
  USING (true);

-- Only service role can insert/update (for backend initialization)
-- Regular users cannot modify global capabilities

-- Add helpful comments
COMMENT ON TABLE public.global_server_capabilities IS 'Stores global server-level capabilities for official MCP servers. These are discovered on the backend and shared across all users.';
COMMENT ON COLUMN public.global_server_capabilities.server_slug IS 'Server identifier (slug format) matching official server names';
COMMENT ON COLUMN public.global_server_capabilities.tools IS 'Array of tools available from the MCP server (functions that can be executed)';
COMMENT ON COLUMN public.global_server_capabilities.resources IS 'Array of resources available from the MCP server (data that can be read)';
COMMENT ON COLUMN public.global_server_capabilities.prompts IS 'Array of prompts available from the MCP server (pre-built prompt templates)';
COMMENT ON COLUMN public.global_server_capabilities.server_info IS 'Metadata about the MCP server (name, version, protocol version)';
COMMENT ON COLUMN public.global_server_capabilities.discovered_at IS 'When the capabilities were last discovered from the server';
