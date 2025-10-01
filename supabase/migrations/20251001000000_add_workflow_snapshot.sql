-- Add workflow_snapshot column to workflow_runs to store the state at execution time
-- This allows us to show the exact workflow structure that was executed

ALTER TABLE workflow_runs 
ADD COLUMN IF NOT EXISTS workflow_snapshot JSONB DEFAULT '{}';

COMMENT ON COLUMN workflow_runs.workflow_snapshot IS 'Snapshot of the workflow structure (nodes, edges, triggers) at execution time';

