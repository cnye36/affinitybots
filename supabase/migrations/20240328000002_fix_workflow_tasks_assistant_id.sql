-- Drop the assistant_id column from workflow_tasks if it exists
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'workflow_tasks' 
        AND column_name = 'assistant_id'
    ) THEN
        ALTER TABLE workflow_tasks DROP COLUMN assistant_id;
    END IF;
END $$; 