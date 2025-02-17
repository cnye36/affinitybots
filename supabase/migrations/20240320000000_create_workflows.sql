-- Create enum types for status if they don't exist
DO $$ BEGIN
    CREATE TYPE workflow_status AS ENUM ('draft', 'active', 'paused', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('pending', 'running', 'completed', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Workflows table to store workflow metadata and graph structure
CREATE TABLE IF NOT EXISTS workflows (
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

-- Agent tasks table to store reusable task configurations for agents
CREATE TABLE IF NOT EXISTS agent_tasks (
    task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_id UUID NOT NULL REFERENCES assistant(assistant_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    task_type TEXT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Tasks table to store individual task configurations for each node in a workflow
CREATE TABLE IF NOT EXISTS workflow_tasks (
    workflow_task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES agent_tasks(task_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    status task_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    last_run_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Table to store workflow runs and their status
CREATE TABLE IF NOT EXISTS workflow_runs (
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
CREATE TABLE IF NOT EXISTS workflow_task_runs (
    task_run_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(run_id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES workflow_tasks(workflow_task_id) ON DELETE CASCADE,
    run_id UUID REFERENCES runs(run_id),
    status task_status NOT NULL DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    error TEXT,
    result JSONB,
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workflows_owner ON workflows(owner_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow ON workflow_tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_task_runs_workflow_run ON workflow_task_runs(workflow_run_id);

-- Add RLS policies
ALTER TABLE IF NOT EXISTS workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF NOT EXISTS workflow_task_runs ENABLE ROW LEVEL SECURITY;







-- Create functions to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';



-- Create agent_tasks policies if table exists
DO $$ BEGIN
    CREATE POLICY "Users can view tasks for their assistants"
        ON agent_tasks FOR SELECT
        USING (EXISTS (
            SELECT 1 FROM assistant
            WHERE assistant.assistant_id = agent_tasks.assistant_id
            AND assistant.metadata->>'owner_id' = auth.uid()::text
        ));

    CREATE POLICY "Users can create tasks for their assistants"
        ON agent_tasks FOR INSERT
        WITH CHECK (EXISTS (
            SELECT 1 FROM assistant
            WHERE assistant.assistant_id = agent_tasks.assistant_id
            AND assistant.metadata->>'owner_id' = auth.uid()::text
        ));

    CREATE POLICY "Users can update tasks for their assistants"
        ON agent_tasks FOR UPDATE
        USING (EXISTS (
            SELECT 1 FROM assistant
            WHERE assistant.assistant_id = agent_tasks.assistant_id
            AND assistant.metadata->>'owner_id' = auth.uid()::text
        ));

    CREATE POLICY "Users can delete tasks for their assistants"
        ON agent_tasks FOR DELETE
        USING (EXISTS (
            SELECT 1 FROM assistant
            WHERE assistant.assistant_id = agent_tasks.assistant_id
            AND assistant.metadata->>'owner_id' = auth.uid()::text
        ));
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

-- Create trigger for agent_tasks if table exists
DO $$ BEGIN
    CREATE TRIGGER update_agent_tasks_updated_at
        BEFORE UPDATE ON agent_tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN undefined_table OR duplicate_object THEN
    NULL;
END $$; 