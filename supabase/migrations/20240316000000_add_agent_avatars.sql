-- Add avatar column to agents table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'agents' AND column_name = 'avatar') THEN
        ALTER TABLE agents ADD COLUMN avatar text;
    END IF;
END $$;

-- Create or update RLS policies
DROP POLICY IF EXISTS "Users can read their own agents" ON public.agents;
CREATE POLICY "Users can read their own agents" ON public.agents
    FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own agents" ON public.agents;
CREATE POLICY "Users can update their own agents" ON public.agents
    FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own agents" ON public.agents;
CREATE POLICY "Users can delete their own agents" ON public.agents
    FOR DELETE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own agents" ON public.agents;
CREATE POLICY "Users can insert their own agents" ON public.agents
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Enable RLS on agents table if not already enabled
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- Enable storage for agent avatars
INSERT INTO storage.buckets (id, name, public) 
VALUES ('agent-avatars', 'agent-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Update storage policies
DROP POLICY IF EXISTS "Users can upload agent avatars" ON storage.objects;
CREATE POLICY "Users can upload agent avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'agent-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Add policy for reading avatars
DROP POLICY IF EXISTS "Users can read agent avatars" ON storage.objects;
CREATE POLICY "Users can read agent avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'agent-avatars'
); 