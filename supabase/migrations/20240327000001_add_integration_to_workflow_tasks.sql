-- Add integration column to workflow_tasks table
ALTER TABLE workflow_tasks
ADD COLUMN integration JSONB DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN workflow_tasks.integration IS 'Stores integration configuration including type, credentials, and settings';

-- Create an index for faster queries if needed
CREATE INDEX idx_workflow_tasks_integration ON workflow_tasks USING gin (integration); 