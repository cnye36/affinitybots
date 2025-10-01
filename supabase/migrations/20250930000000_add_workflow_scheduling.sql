-- Add scheduling metadata to workflow_triggers
ALTER TABLE workflow_triggers 
  ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS schedule_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS schedule_metadata JSONB DEFAULT '{}';

-- Create index for efficient schedule queries
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_next_run 
  ON workflow_triggers(next_run_at) 
  WHERE trigger_type = 'schedule' AND is_active = true AND schedule_enabled = true;

-- Create schedule execution log table
CREATE TABLE IF NOT EXISTS workflow_schedule_executions (
  execution_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trigger_id UUID NOT NULL REFERENCES workflow_triggers(trigger_id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  error TEXT,
  run_id UUID REFERENCES workflow_runs(run_id),
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for execution log
CREATE INDEX IF NOT EXISTS idx_schedule_executions_trigger 
  ON workflow_schedule_executions(trigger_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedule_executions_workflow 
  ON workflow_schedule_executions(workflow_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_schedule_executions_status 
  ON workflow_schedule_executions(status, executed_at DESC);

-- Enable RLS on schedule executions
ALTER TABLE workflow_schedule_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own schedule executions
CREATE POLICY "Users can view their own schedule executions"
ON workflow_schedule_executions
FOR SELECT
USING (
  workflow_id IN (
    SELECT workflow_id FROM workflows WHERE owner_id = auth.uid()
  )
);

-- Add helper function to calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run(
  cron_expr TEXT,
  from_time TIMESTAMPTZ DEFAULT NOW(),
  timezone TEXT DEFAULT 'UTC'
) RETURNS TIMESTAMPTZ AS $$
BEGIN
  -- This is a placeholder - actual cron calculation happens in application layer
  -- This function is here for potential future use with pg_cron
  RETURN from_time + INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment for documentation
COMMENT ON TABLE workflow_schedule_executions IS 'Tracks execution history of scheduled workflow triggers';
COMMENT ON COLUMN workflow_triggers.next_run_at IS 'Next scheduled execution time (UTC)';
COMMENT ON COLUMN workflow_triggers.schedule_enabled IS 'Whether the schedule is currently active';
COMMENT ON COLUMN workflow_triggers.schedule_metadata IS 'Additional schedule info: timezone, last_status, retry_count, etc.';

