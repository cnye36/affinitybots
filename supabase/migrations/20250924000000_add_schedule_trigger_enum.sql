-- Add 'schedule' to trigger_type enum if it doesn't already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'trigger_type' AND e.enumlabel = 'schedule'
    ) THEN
        ALTER TYPE trigger_type ADD VALUE 'schedule';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END$$;


