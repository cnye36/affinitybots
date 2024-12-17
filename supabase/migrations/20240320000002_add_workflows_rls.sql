-- Enable RLS
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can insert their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;

-- Create policies
CREATE POLICY "Users can view their own workflows"
ON workflows FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own workflows"
ON workflows FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workflows"
ON workflows FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own workflows"
ON workflows FOR DELETE
USING (auth.uid() = owner_id); 