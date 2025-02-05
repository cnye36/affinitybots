-- Enable RLS on workflows table
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Create policies for workflows
CREATE POLICY "Users can view their own workflows"
  ON workflows
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own workflows"
  ON workflows
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workflows"
  ON workflows
  FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own workflows"
  ON workflows
  FOR DELETE
  USING (auth.uid() = owner_id); 