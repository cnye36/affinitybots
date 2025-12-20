-- Create tutorial completion tracking table
CREATE TABLE IF NOT EXISTS public.user_tutorial_completion (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tutorial_completion_user_id
  ON public.user_tutorial_completion(user_id);

-- Enable RLS
ALTER TABLE public.user_tutorial_completion ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read/write their own tutorial completion data
CREATE POLICY "Users can manage their own tutorial completion"
  ON public.user_tutorial_completion
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_tutorial_completion_updated_at
  BEFORE UPDATE ON public.user_tutorial_completion
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
