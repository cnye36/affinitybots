-- Create mapping table for user's assistants
CREATE TABLE IF NOT EXISTS user_assistants (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assistant_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, assistant_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS user_assistants_assistant_id_idx ON user_assistants(assistant_id);

-- Add index for user_id lookups
CREATE INDEX IF NOT EXISTS user_assistants_user_id_idx ON user_assistants(user_id);

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

-- Create trigger function to automatically add user-assistant mapping when assistant is created
CREATE OR REPLACE FUNCTION add_user_assistant_mapping()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_assistants (user_id, assistant_id)
  VALUES ((NEW.metadata->>'owner_id')::uuid, NEW.assistant_id)
  ON CONFLICT (user_id, assistant_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add mapping when assistant is created
CREATE TRIGGER add_user_assistant_mapping_trigger
  AFTER INSERT ON assistant
  FOR EACH ROW
  EXECUTE FUNCTION add_user_assistant_mapping();

-- Add foreign key constraint to user_assistants table
ALTER TABLE user_assistants
ADD CONSTRAINT user_assistants_assistant_id_fkey
FOREIGN KEY (assistant_id) REFERENCES assistant(assistant_id)
ON DELETE CASCADE; 