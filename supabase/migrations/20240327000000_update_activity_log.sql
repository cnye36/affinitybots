-- First update existing records from agent_created to assistant_created
UPDATE activity_log
SET type = 'assistant_created'
WHERE type = 'agent_created';

-- Now update the type check constraint
ALTER TABLE activity_log 
  DROP CONSTRAINT IF EXISTS activity_log_type_check;

ALTER TABLE activity_log 
  ADD CONSTRAINT activity_log_type_check 
  CHECK (type IN ('workflow_completed', 'assistant_created', 'workflow_error'));

-- Create new function to log assistant creation
CREATE OR REPLACE FUNCTION log_assistant_creation()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the assistant name from the assistant table
  INSERT INTO activity_log (user_id, type, message, metadata)
  VALUES (
    (NEW.metadata->>'owner_id')::uuid,
    'assistant_created',
    'New AI Assistant "' || NEW.name || '" created',
    jsonb_build_object('assistant_id', NEW.assistant_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assistant creation
CREATE TRIGGER log_assistant_creation_trigger
  AFTER INSERT ON assistant
  FOR EACH ROW
  EXECUTE FUNCTION log_assistant_creation(); 