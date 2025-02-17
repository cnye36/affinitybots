-- Ensure workflow_tasks has the correct schema
ALTER TABLE workflow_tasks
ALTER COLUMN name DROP NOT NULL,
ALTER COLUMN description DROP NOT NULL,
ALTER COLUMN task_type DROP NOT NULL;

-- Add default values for timestamps if they don't exist
DO $$ BEGIN
    ALTER TABLE workflow_tasks
    ALTER COLUMN created_at SET DEFAULT TIMEZONE('utc'::text, NOW()),
    ALTER COLUMN updated_at SET DEFAULT TIMEZONE('utc'::text, NOW());
EXCEPTION WHEN undefined_column THEN
    NULL;
END $$;

-- Ensure we have the correct indexes
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_id ON workflow_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_task_id ON workflow_tasks(task_id);

-- Ensure RLS is enabled
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies
DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view tasks in their workflows" ON workflow_tasks;
    DROP POLICY IF EXISTS "Users can create tasks in their workflows" ON workflow_tasks;
    DROP POLICY IF EXISTS "Users can update tasks in their workflows" ON workflow_tasks;
    DROP POLICY IF EXISTS "Users can delete tasks in their workflows" ON workflow_tasks;

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
END $$; 