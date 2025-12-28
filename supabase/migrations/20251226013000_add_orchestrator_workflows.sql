-- Migration: Add orchestrator workflow support
-- Created: 2026-01-01
-- Description: Adds workflow_type enum and orchestrator_config to support both sequential and orchestrator-based workflows

-- Create enum for workflow types (safe to run if already exists)
DO $$ BEGIN
    CREATE TYPE workflow_type AS ENUM ('sequential', 'orchestrator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add workflow_type column to workflows table
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS workflow_type workflow_type DEFAULT 'sequential' NOT NULL;

-- Add orchestrator configuration column
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS orchestrator_config JSONB DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN workflows.workflow_type IS 'Type of workflow execution: sequential (tasks run in order) or orchestrator (manager agent coordinates sub-agents)';
COMMENT ON COLUMN workflows.orchestrator_config IS 'Configuration for the orchestrator/manager agent when workflow_type is orchestrator. Includes system_prompt, user_prompt, model selection, and execution settings.';

-- Create index for filtering by workflow type
CREATE INDEX IF NOT EXISTS idx_workflows_type ON workflows(workflow_type);

-- Example orchestrator_config structure (for reference):
-- {
--   "manager": {
--     "system_prompt": "You are a manager agent coordinating a team of AI assistants...",
--     "user_prompt": "Research market trends and write a comprehensive report...",
--     "model": "openai:gpt-5",
--     "temperature": 0.3,
--     "reasoningEffort": "medium"
--   },
--   "execution": {
--     "max_iterations": 10,
--     "require_completion_signal": true
--   }
-- }
