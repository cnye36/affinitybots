-- Drop existing foreign key if it exists
ALTER TABLE workflow_tasks
DROP CONSTRAINT IF EXISTS workflow_tasks_task_id_fkey;

-- Add the foreign key constraint back
ALTER TABLE workflow_tasks
ADD CONSTRAINT workflow_tasks_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES agent_tasks(task_id)
ON DELETE CASCADE;

-- Create index for better join performance
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_task_id
ON workflow_tasks(task_id);

-- Enable RLS on agent_tasks if not already enabled
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- Ensure workflow_tasks has RLS enabled
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Add policies for workflow_tasks if they don't exist
DO $$ BEGIN
    CREATE POLICY "Users can view tasks in their workflows"
        ON workflow_tasks FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.workflow_id = workflow_tasks.workflow_id
            AND workflows.owner_id = auth.uid()
        ));

    CREATE POLICY "Users can create tasks in their workflows"
        ON workflow_tasks FOR INSERT
        WITH CHECK (EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.workflow_id = workflow_tasks.workflow_id
            AND workflows.owner_id = auth.uid()
        ));

    CREATE POLICY "Users can update tasks in their workflows"
        ON workflow_tasks FOR UPDATE
        USING (EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.workflow_id = workflow_tasks.workflow_id
            AND workflows.owner_id = auth.uid()
        ));

    CREATE POLICY "Users can delete tasks in their workflows"
        ON workflow_tasks FOR DELETE
        USING (EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.workflow_id = workflow_tasks.workflow_id
            AND workflows.owner_id = auth.uid()
        ));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 