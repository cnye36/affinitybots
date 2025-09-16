-- Extend trigger_type enum with schedule; if not using ENUM in DB, skip
DO $$ BEGIN
  ALTER TYPE trigger_type ADD VALUE IF NOT EXISTS 'schedule';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure columns exist
ALTER TABLE IF EXISTS workflow_triggers
  ADD COLUMN IF NOT EXISTS last_fired_at TIMESTAMPTZ;

-- Helpful index when querying by active triggers
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_active ON workflow_triggers(is_active);


