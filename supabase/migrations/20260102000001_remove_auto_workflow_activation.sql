-- Remove automatic workflow activation trigger
-- Workflows should only be activated manually by users via the UI toggle

-- Drop the trigger that automatically activates workflows when triggers are created
DROP TRIGGER IF EXISTS update_workflow_activation_on_trigger_change ON workflow_triggers;

-- Drop the function as well
DROP FUNCTION IF EXISTS update_workflow_activation_status();

-- Note: We keep manual control of workflow activation via the UI toggle
-- Users must explicitly activate workflows when they are ready
