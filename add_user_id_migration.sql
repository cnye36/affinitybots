-- Add user_id column to agent table
ALTER TABLE public.agent ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing agents to set user_id from metadata if it exists
UPDATE public.agent
SET user_id = (metadata->>'owner_id')::uuid
WHERE metadata->>'owner_id' IS NOT NULL;

-- Drop existing RLS policies for agent table that we'll replace
DROP POLICY IF EXISTS "Users can insert their own agents" ON public.agent;
DROP POLICY IF EXISTS "Users can update agents they have access to" ON public.agent;
DROP POLICY IF EXISTS "Users can delete agents they have access to" ON public.agent;
DROP POLICY IF EXISTS "Users can view agents they have access to" ON public.agent;

-- Create new simpler RLS policies using the user_id column directly
CREATE POLICY "Users can view their own agents" ON public.agent
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own agents" ON public.agent
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own agents" ON public.agent
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own agents" ON public.agent
  FOR DELETE USING (user_id = auth.uid()); 