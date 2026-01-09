-- Create table for storing user tool approval preferences
CREATE TABLE IF NOT EXISTS tool_approval_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id TEXT NOT NULL,

  -- Approval type: 'tool' or 'integration'
  approval_type TEXT NOT NULL CHECK (approval_type IN ('tool', 'integration')),

  -- For 'tool' type: specific tool name
  -- For 'integration' type: MCP server name
  approval_target TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure no duplicate preferences
  UNIQUE(user_id, assistant_id, approval_type, approval_target)
);

-- Enable RLS
ALTER TABLE tool_approval_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own approval preferences
CREATE POLICY "Users can view their own approval preferences"
  ON tool_approval_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own approval preferences"
  ON tool_approval_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own approval preferences"
  ON tool_approval_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own approval preferences"
  ON tool_approval_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_tool_approval_preferences_user_assistant
  ON tool_approval_preferences(user_id, assistant_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_tool_approval_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tool_approval_preferences_updated_at
  BEFORE UPDATE ON tool_approval_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_tool_approval_preferences_updated_at();
