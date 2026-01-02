-- Create table for storing MCP server capabilities (tools, resources, prompts)
CREATE TABLE IF NOT EXISTS public.mcp_server_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qualified_name TEXT NOT NULL,

  -- Discovered capabilities (stored as JSONB for flexibility)
  tools JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  prompts JSONB DEFAULT '[]'::jsonb,

  -- Server metadata
  server_info JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one capabilities record per user per server
  CONSTRAINT mcp_server_capabilities_user_server_unique UNIQUE (user_id, qualified_name)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS mcp_server_capabilities_user_id_idx
  ON public.mcp_server_capabilities(user_id);

CREATE INDEX IF NOT EXISTS mcp_server_capabilities_qualified_name_idx
  ON public.mcp_server_capabilities(qualified_name);

CREATE INDEX IF NOT EXISTS mcp_server_capabilities_discovered_at_idx
  ON public.mcp_server_capabilities(discovered_at DESC);

-- Enable Row Level Security
ALTER TABLE public.mcp_server_capabilities ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own server capabilities
CREATE POLICY "Users can view their own server capabilities"
  ON public.mcp_server_capabilities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own server capabilities"
  ON public.mcp_server_capabilities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own server capabilities"
  ON public.mcp_server_capabilities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own server capabilities"
  ON public.mcp_server_capabilities
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_mcp_capabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_mcp_capabilities_updated_at
  BEFORE UPDATE ON public.mcp_server_capabilities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_mcp_capabilities_updated_at();

-- Add helpful comments
COMMENT ON TABLE public.mcp_server_capabilities IS 'Stores discovered capabilities (tools, resources, prompts) for MCP servers';
COMMENT ON COLUMN public.mcp_server_capabilities.tools IS 'Array of tools available from the MCP server (functions that can be executed)';
COMMENT ON COLUMN public.mcp_server_capabilities.resources IS 'Array of resources available from the MCP server (data that can be read)';
COMMENT ON COLUMN public.mcp_server_capabilities.prompts IS 'Array of prompts available from the MCP server (pre-built prompt templates)';
COMMENT ON COLUMN public.mcp_server_capabilities.server_info IS 'Metadata about the MCP server (name, version, protocol version)';
COMMENT ON COLUMN public.mcp_server_capabilities.discovered_at IS 'When the capabilities were last discovered from the server';
