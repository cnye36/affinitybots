-- Restore workflow_runs and workflow_task_runs dropped by 20240329000000_simplify_workflow_tasks.sql
-- Also fix task_runs.task_id foreign key to reference workflow_tasks.workflow_task_id

-- Ensure enums exist
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create workflow_runs if missing
CREATE TABLE IF NOT EXISTS workflow_runs (
  run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
  thread_id UUID REFERENCES threads(thread_id),
  status task_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  result JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id)
);

-- Create workflow_task_runs if missing
CREATE TABLE IF NOT EXISTS workflow_task_runs (
  run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(run_id) ON DELETE CASCADE,
  workflow_task_id UUID NOT NULL REFERENCES workflow_tasks(workflow_task_id) ON DELETE CASCADE,
  status task_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  result JSONB,
  metadata JSONB NOT NULL DEFAULT '{}',
  owner_id UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_task_runs_workflow_run ON workflow_task_runs(workflow_run_id);

-- Enable RLS
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_task_runs ENABLE ROW LEVEL SECURITY;

-- RLS policies (owner-based)
DROP POLICY IF EXISTS "Select own workflow_runs" ON workflow_runs;
CREATE POLICY "Select own workflow_runs" ON workflow_runs
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Insert own workflow_runs" ON workflow_runs;
CREATE POLICY "Insert own workflow_runs" ON workflow_runs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Update own workflow_runs" ON workflow_runs;
CREATE POLICY "Update own workflow_runs" ON workflow_runs
  FOR UPDATE USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Select own workflow_task_runs" ON workflow_task_runs;
CREATE POLICY "Select own workflow_task_runs" ON workflow_task_runs
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Insert own workflow_task_runs" ON workflow_task_runs;
CREATE POLICY "Insert own workflow_task_runs" ON workflow_task_runs
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Update own workflow_task_runs" ON workflow_task_runs;
CREATE POLICY "Update own workflow_task_runs" ON workflow_task_runs
  FOR UPDATE USING (owner_id = auth.uid());

-- Fix task_runs.task_id to reference workflow_tasks.workflow_task_id if table exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'task_runs' AND column_name = 'task_id'
  ) THEN
    -- Drop old FK if present and recreate referencing workflow_tasks.workflow_task_id
    ALTER TABLE task_runs DROP CONSTRAINT IF EXISTS task_runs_task_id_fkey;
    ALTER TABLE task_runs
      ADD CONSTRAINT task_runs_task_id_fkey
      FOREIGN KEY (task_id) REFERENCES workflow_tasks(workflow_task_id) ON DELETE CASCADE;
  END IF;
END $$;


