-- Create activity_log table
CREATE TABLE activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('workflow_completed', 'agent_created', 'workflow_error')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add RLS policies
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own activity logs"
  ON activity_log
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs"
  ON activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX activity_log_user_id_idx ON activity_log(user_id);
CREATE INDEX activity_log_created_at_idx ON activity_log(created_at DESC);

-- Create function to log agent creation
CREATE OR REPLACE FUNCTION log_agent_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (user_id, type, message, metadata)
  VALUES (
    NEW.owner_id,
    'agent_created',
    'New AI Agent "' || NEW.name || '" created',
    jsonb_build_object('agent_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for agent creation
CREATE TRIGGER log_agent_creation_trigger
  AFTER INSERT ON agents
  FOR EACH ROW
  EXECUTE FUNCTION log_agent_creation();

-- Create function to log workflow completion/error
CREATE OR REPLACE FUNCTION log_workflow_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO activity_log (user_id, type, message, metadata)
    VALUES (
      NEW.owner_id,
      'workflow_completed',
      'Workflow "' || NEW.name || '" completed successfully',
      jsonb_build_object('workflow_id', NEW.id)
    );
  ELSIF NEW.status = 'error' AND OLD.status != 'error' THEN
    INSERT INTO activity_log (user_id, type, message, metadata)
    VALUES (
      NEW.owner_id,
      'workflow_error',
      'Error in workflow "' || NEW.name || '"',
      jsonb_build_object('workflow_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for workflow status changes
CREATE TRIGGER log_workflow_status_change_trigger
  AFTER UPDATE ON workflows
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION log_workflow_status_change(); 