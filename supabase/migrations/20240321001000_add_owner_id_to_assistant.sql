-- Create mapping table for user's assistants
CREATE TABLE IF NOT EXISTS user_assistants (
  user_id UUID NOT NULL REFERENCES auth.users(id),
  assistant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, assistant_id)
);

-- Add index for faster lookups
CREATE INDEX user_assistants_assistant_id_idx ON user_assistants(assistant_id);

-- Add RLS policies
ALTER TABLE user_assistants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assistant mappings"
  ON user_assistants
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own assistant mappings"
  ON user_assistants
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own assistant mappings"
  ON user_assistants
  FOR DELETE
  USING (auth.uid() = user_id);