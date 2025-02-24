-- First remove the existing foreign key constraint
ALTER TABLE task_runs
DROP CONSTRAINT IF EXISTS task_runs_task_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE task_runs
ADD CONSTRAINT task_runs_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES workflow_tasks(workflow_task_id)
ON DELETE CASCADE;

-- Ensure workflow_tasks still has ON DELETE CASCADE for workflows
ALTER TABLE workflow_tasks
DROP CONSTRAINT IF EXISTS workflow_tasks_workflow_id_fkey;

ALTER TABLE workflow_tasks
ADD CONSTRAINT workflow_tasks_workflow_id_fkey
FOREIGN KEY (workflow_id)
REFERENCES workflows(workflow_id)
ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_runs_task_id ON task_runs(task_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_id ON workflow_tasks(workflow_id); 