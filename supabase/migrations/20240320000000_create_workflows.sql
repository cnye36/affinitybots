-- Create enum types for status
CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'completed', 'failed');
CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Workflows table to store workflow metadata and graph structure
CREATE TABLE workflows (
    workflow_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nodes JSONB NOT NULL DEFAULT '[]',
    edges JSONB NOT NULL DEFAULT '[]',
    config JSONB NOT NULL DEFAULT '{}',
    status workflow_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false
);

-- Tasks table to store individual task configurations for each node in a workflow
CREATE TABLE workflow_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    assistant_id UUID NOT NULL REFERENCES assistants(assistant_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    position INTEGER NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Table to store workflow runs and their status
CREATE TABLE workflow_runs (
    run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    thread_id UUID REFERENCES threads(thread_id),
    status task_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    result JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Table to store individual task runs within a workflow run
CREATE TABLE workflow_task_runs (
    task_run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(run_id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES workflow_tasks(task_id) ON DELETE CASCADE,
    run_id UUID REFERENCES runs(run_id),
    status task_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    result JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX idx_workflows_owner ON workflows(owner_id);
CREATE INDEX idx_workflow_tasks_workflow ON workflow_tasks(workflow_id);
CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_task_runs_workflow_run ON workflow_task_runs(workflow_run_id);

-- Add RLS policies
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_task_runs ENABLE ROW LEVEL SECURITY;

-- Workflows policies
CREATE POLICY "Users can view their own workflows"
    ON workflows FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own workflows"
    ON workflows FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workflows"
    ON workflows FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own workflows"
    ON workflows FOR DELETE
    USING (auth.uid() = owner_id);

-- Workflow tasks policies
CREATE POLICY "Users can view tasks for their workflows"
    ON workflow_tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workflows
        WHERE workflows.workflow_id = workflow_tasks.workflow_id
        AND workflows.owner_id = auth.uid()
    ));

CREATE POLICY "Users can create tasks for their workflows"
    ON workflow_tasks FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM workflows
        WHERE workflows.workflow_id = workflow_tasks.workflow_id
        AND workflows.owner_id = auth.uid()
    ));

CREATE POLICY "Users can update tasks for their workflows"
    ON workflow_tasks FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM workflows
        WHERE workflows.workflow_id = workflow_tasks.workflow_id
        AND workflows.owner_id = auth.uid()
    ));

CREATE POLICY "Users can delete tasks for their workflows"
    ON workflow_tasks FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM workflows
        WHERE workflows.workflow_id = workflow_tasks.workflow_id
        AND workflows.owner_id = auth.uid()
    ));

-- Workflow runs policies
CREATE POLICY "Users can view runs for their workflows"
    ON workflow_runs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workflows
        WHERE workflows.workflow_id = workflow_runs.workflow_id
        AND workflows.owner_id = auth.uid()
    ));

-- Workflow task runs policies
CREATE POLICY "Users can view task runs for their workflows"
    ON workflow_task_runs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM workflow_runs
        WHERE workflow_runs.run_id = workflow_task_runs.workflow_run_id
        AND EXISTS (
            SELECT 1 FROM workflows
            WHERE workflows.workflow_id = workflow_runs.workflow_id
            AND workflows.owner_id = auth.uid()
        )
    ));

-- Create functions to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_workflows_updated_at
    BEFORE UPDATE ON workflows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_tasks_updated_at
    BEFORE UPDATE ON workflow_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 