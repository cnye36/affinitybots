-- Migration to handle agent deletion in workflows
-- When an agent is deleted, set workflow_tasks.assistant_id to NULL instead of cascading

-- First, drop the existing foreign key constraint if it exists
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name dynamically
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'workflow_tasks'::regclass
    AND confrelid = 'assistant'::regclass
    AND contype = 'f'
    LIMIT 1;
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE workflow_tasks DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

-- Add the new foreign key constraint with ON DELETE SET NULL
ALTER TABLE workflow_tasks
ADD CONSTRAINT workflow_tasks_assistant_id_fkey
FOREIGN KEY (assistant_id)
REFERENCES assistant(assistant_id)
ON DELETE SET NULL;

-- Add a comment to document this behavior
COMMENT ON CONSTRAINT workflow_tasks_assistant_id_fkey ON workflow_tasks IS 
'When an agent is deleted, the task remains but assistant_id is set to NULL, allowing reassignment';
