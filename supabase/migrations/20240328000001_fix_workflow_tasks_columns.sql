-- First drop the dependent foreign key constraints
ALTER TABLE workflow_task_runs
DROP CONSTRAINT IF EXISTS workflow_task_runs_task_id_fkey;

-- Ensure workflow_tasks has the correct columns
DO $$ BEGIN
    -- Check if neither column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_tasks' 
        AND column_name IN ('id', 'workflow_task_id')
    ) THEN
        -- Add the id column if neither exists
        ALTER TABLE workflow_tasks 
        ADD COLUMN id UUID DEFAULT uuid_generate_v4();
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_tasks' 
        AND column_name = 'workflow_task_id'
    ) THEN
        -- Drop the primary key constraint with CASCADE if it exists
        ALTER TABLE workflow_tasks 
        DROP CONSTRAINT IF EXISTS workflow_tasks_pkey CASCADE;
        
        -- Now we can safely rename the column
        ALTER TABLE workflow_tasks RENAME COLUMN workflow_task_id TO id;
    END IF;
END $$;

-- Drop any existing primary key constraint
ALTER TABLE workflow_tasks 
DROP CONSTRAINT IF EXISTS workflow_tasks_pkey CASCADE;

-- Ensure we have the correct primary key
ALTER TABLE workflow_tasks
ADD CONSTRAINT workflow_tasks_pkey 
PRIMARY KEY (id);

-- Recreate the foreign key constraint in workflow_task_runs
ALTER TABLE workflow_task_runs
ADD CONSTRAINT workflow_task_runs_task_id_fkey
FOREIGN KEY (task_id) 
REFERENCES workflow_tasks(id)
ON DELETE CASCADE;

-- Ensure we have the correct indexes
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_id ON workflow_tasks(id);
CREATE INDEX IF NOT EXISTS idx_workflow_task_runs_task_id ON workflow_task_runs(task_id); 