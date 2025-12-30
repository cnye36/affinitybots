-- Add activated_at timestamp to workflows table to track activation order
-- This is used to enforce plan limits (e.g., only first 5 activated workflows for starter plan)

ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on activation order
CREATE INDEX IF NOT EXISTS idx_workflows_activated_at ON workflows(owner_id, activated_at) WHERE activated_at IS NOT NULL;

-- Update existing active workflows to set activated_at based on their last_run_at or created_at
UPDATE workflows
SET activated_at = COALESCE(last_run_at, created_at)
WHERE is_active = true AND activated_at IS NULL;

-- Create function to update workflow activation status based on triggers
CREATE OR REPLACE FUNCTION update_workflow_activation_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a trigger becomes active
  IF NEW.is_active = true THEN
    -- Check if workflow has any active triggers (including this one if it's new)
    DECLARE
      workflow_active BOOLEAN;
      workflow_has_activated_at BOOLEAN;
    BEGIN
      -- Check if workflow already has activated_at
      SELECT activated_at IS NOT NULL INTO workflow_has_activated_at
      FROM workflows
      WHERE workflow_id = NEW.workflow_id;

      -- If this is the first activation, set activated_at
      IF NOT workflow_has_activated_at THEN
        UPDATE workflows
        SET
          is_active = true,
          activated_at = NOW()
        WHERE workflow_id = NEW.workflow_id;
      ELSE
        -- Just make sure is_active is true
        UPDATE workflows
        SET is_active = true
        WHERE workflow_id = NEW.workflow_id;
      END IF;
    END;
  END IF;

  -- When a trigger becomes inactive
  IF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
    -- Check if workflow has any other active triggers
    DECLARE
      has_active_triggers BOOLEAN;
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM workflow_triggers
        WHERE workflow_id = NEW.workflow_id
          AND is_active = true
          AND trigger_id != NEW.trigger_id
      ) INTO has_active_triggers;

      -- If no active triggers remain, deactivate workflow
      IF NOT has_active_triggers THEN
        UPDATE workflows
        SET is_active = false
        WHERE workflow_id = NEW.workflow_id;
      END IF;
    END;
  END IF;

  -- When a trigger is deleted
  IF TG_OP = 'DELETE' AND OLD.is_active = true THEN
    -- Check if workflow has any other active triggers
    DECLARE
      has_active_triggers BOOLEAN;
    BEGIN
      SELECT EXISTS(
        SELECT 1 FROM workflow_triggers
        WHERE workflow_id = OLD.workflow_id
          AND is_active = true
          AND trigger_id != OLD.trigger_id
      ) INTO has_active_triggers;

      -- If no active triggers remain, deactivate workflow
      IF NOT has_active_triggers THEN
        UPDATE workflows
        SET is_active = false
        WHERE workflow_id = OLD.workflow_id;
      END IF;
    END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update workflow activation when triggers change
DROP TRIGGER IF EXISTS update_workflow_activation_on_trigger_change ON workflow_triggers;
CREATE TRIGGER update_workflow_activation_on_trigger_change
  AFTER INSERT OR UPDATE OR DELETE ON workflow_triggers
  FOR EACH ROW
  EXECUTE FUNCTION update_workflow_activation_status();
