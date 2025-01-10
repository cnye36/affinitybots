-- Create enum for task types
CREATE TYPE task_type AS ENUM (
  'process_input',
  'generate_content',
  'analyze_data',
  'make_decision',
  'transform_data',
  'api_call',
  'custom'
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create runs table for workflow execution tracking
CREATE TABLE IF NOT EXISTS workflow_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create task runs table for individual task execution tracking
CREATE TABLE IF NOT EXISTS task_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX tasks_agent_id_idx ON tasks(agent_id);
CREATE INDEX tasks_workflow_id_idx ON tasks(workflow_id);
CREATE INDEX tasks_created_by_idx ON tasks(created_by);
CREATE INDEX tasks_order_idx ON tasks("order");

CREATE INDEX workflow_runs_workflow_id_idx ON workflow_runs(workflow_id);
CREATE INDEX workflow_runs_created_by_idx ON workflow_runs(created_by);
CREATE INDEX workflow_runs_status_idx ON workflow_runs(status);

CREATE INDEX task_runs_workflow_run_id_idx ON task_runs(workflow_run_id);
CREATE INDEX task_runs_task_id_idx ON task_runs(task_id);
CREATE INDEX task_runs_status_idx ON task_runs(status);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for tasks
CREATE POLICY "Users can view tasks in their workflows"
  ON tasks FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM workflows WHERE id = workflow_id
    )
  );

CREATE POLICY "Users can insert tasks in their workflows"
  ON tasks FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM workflows WHERE id = workflow_id
    )
  );

CREATE POLICY "Users can update tasks in their workflows"
  ON tasks FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM workflows WHERE id = workflow_id
    )
  );

CREATE POLICY "Users can delete tasks in their workflows"
  ON tasks FOR DELETE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM workflows WHERE id = workflow_id
    )
  );

-- Create policies for workflow runs
CREATE POLICY "Users can view their workflow runs"
  ON workflow_runs FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their workflow runs"
  ON workflow_runs FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their workflow runs"
  ON workflow_runs FOR UPDATE
  USING (auth.uid() = created_by);

-- Create policies for task runs
CREATE POLICY "Users can view their task runs"
  ON task_runs FOR SELECT
  USING (
    auth.uid() IN (
      SELECT created_by FROM workflow_runs WHERE id = workflow_run_id
    )
  );

CREATE POLICY "Users can insert task runs in their workflows"
  ON task_runs FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT created_by FROM workflow_runs WHERE id = workflow_run_id
    )
  );

CREATE POLICY "Users can update their task runs"
  ON task_runs FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT created_by FROM workflow_runs WHERE id = workflow_run_id
    )
  );

-- Add triggers for updating updated_at
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_workflow_runs_updated_at
  BEFORE UPDATE ON workflow_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_task_runs_updated_at
  BEFORE UPDATE ON task_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 