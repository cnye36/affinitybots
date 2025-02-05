-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can create their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can update their own workflows" ON workflows;
DROP POLICY IF EXISTS "Users can delete their own workflows" ON workflows;

-- Drop any existing triggers
DROP TRIGGER IF EXISTS update_workflows_updated_at ON workflows;
DROP TRIGGER IF EXISTS log_workflow_status_change_trigger ON workflows;

-- Drop any existing functions
DROP FUNCTION IF EXISTS update_workflows_updated_at() CASCADE;
DROP FUNCTION IF EXISTS log_workflow_status_change() CASCADE;

-- Drop any existing indexes
DROP INDEX IF EXISTS idx_workflows_owner;
DROP INDEX IF EXISTS workflows_owner_id_idx;
DROP INDEX IF EXISTS idx_workflows_owner_id;

-- Disable and re-enable RLS to ensure clean state
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

-- Create fresh policies
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

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_workflows_owner_id ON workflows(owner_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_workflows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger
CREATE TRIGGER update_workflows_updated_at
  BEFORE UPDATE ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION update_workflows_updated_at();

-- Create function to automatically set owner_id on insert
CREATE OR REPLACE FUNCTION set_workflows_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.owner_id IS NULL THEN
    NEW.owner_id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set owner_id
CREATE TRIGGER set_workflows_owner_id
  BEFORE INSERT ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION set_workflows_owner_id(); 