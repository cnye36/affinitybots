-- Drop the existing policy
DROP POLICY IF EXISTS "Users can insert their own agents" ON public.agent;

-- Recreate the policy with the correct check
CREATE POLICY "Users can insert their own agents" ON public.agent
  FOR INSERT WITH CHECK ((metadata->>'owner_id')::uuid = auth.uid()); 