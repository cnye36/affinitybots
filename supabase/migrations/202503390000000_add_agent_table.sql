-- Create the agent table
CREATE TABLE IF NOT EXISTS public.agent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  agent_avatar TEXT NOT NULL DEFAULT '/default-avatar.png',
  description TEXT NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the user_agents junction table
CREATE TABLE IF NOT EXISTS public.user_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES public.agent(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, agent_id)
);

-- Add RLS policies

-- Enable RLS on agent table
ALTER TABLE public.agent ENABLE ROW LEVEL SECURITY;

-- Agent policies
CREATE POLICY "Users can view agents they have access to" ON public.agent
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_agents ua
      WHERE ua.agent_id = id AND ua.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own agents" ON public.agent
  FOR INSERT WITH CHECK ((metadata->>'owner_id')::uuid = auth.uid());

CREATE POLICY "Users can update agents they have access to" ON public.agent
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_agents ua
      WHERE ua.agent_id = id AND ua.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agents they have access to" ON public.agent
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_agents ua
      WHERE ua.agent_id = id AND ua.user_id = auth.uid()
    )
  );

-- Enable RLS on user_agents table
ALTER TABLE public.user_agents ENABLE ROW LEVEL SECURITY;

-- User agents policies
CREATE POLICY "Users can view their own user-agent relationships" ON public.user_agents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own user-agent relationships" ON public.user_agents
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own user-agent relationships" ON public.user_agents
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own user-agent relationships" ON public.user_agents
  FOR DELETE USING (user_id = auth.uid());

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_updated_at
BEFORE UPDATE ON public.agent
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_agents_updated_at
BEFORE UPDATE ON public.user_agents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
