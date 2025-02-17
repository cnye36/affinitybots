-- First remove the foreign key constraint from workflow_tasks
ALTER TABLE workflow_tasks
DROP CONSTRAINT IF EXISTS workflow_tasks_task_id_fkey;

-- Now we can safely drop the tables
DROP TABLE IF EXISTS workflow_task_runs;
DROP TABLE IF EXISTS workflow_runs;
DROP TABLE IF EXISTS agent_tasks;

-- Modify workflow_tasks to be self-contained
ALTER TABLE workflow_tasks 
ADD COLUMN IF NOT EXISTS assistant_id UUID REFERENCES assistants(assistant_id),
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
ALTER COLUMN task_type SET NOT NULL;

-- Drop the now unused task_id column
ALTER TABLE workflow_tasks
DROP COLUMN IF EXISTS task_id;

-- Create simplified task_runs table
CREATE TABLE IF NOT EXISTS task_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES workflow_tasks(id),
    status TEXT NOT NULL DEFAULT 'pending',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    result JSONB,
    error TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
); 