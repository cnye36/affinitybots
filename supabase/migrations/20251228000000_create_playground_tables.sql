-- Create playground tables for agent testing and fine-tuning

-- Playground sessions table
CREATE TABLE playground_sessions (
	session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	name TEXT NOT NULL DEFAULT 'Untitled Session',
	description TEXT,

	-- Session configuration
	mode TEXT NOT NULL DEFAULT 'sequential' CHECK (mode IN ('sequential', 'orchestrator')),
	orchestrator_config JSONB,

	-- Session state
	current_agent_id TEXT,
	steps JSONB NOT NULL DEFAULT '[]'::jsonb,
	context_history JSONB NOT NULL DEFAULT '[]'::jsonb,

	-- Metadata
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_playground_sessions_user_id ON playground_sessions(user_id);
CREATE INDEX idx_playground_sessions_last_activity ON playground_sessions(last_activity_at DESC);

-- Enable RLS
ALTER TABLE playground_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for playground_sessions
CREATE POLICY "Users can view their own sessions"
	ON playground_sessions FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
	ON playground_sessions FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
	ON playground_sessions FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
	ON playground_sessions FOR DELETE
	USING (auth.uid() = user_id);

-- Playground steps table
CREATE TABLE playground_steps (
	step_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	session_id UUID NOT NULL REFERENCES playground_sessions(session_id) ON DELETE CASCADE,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

	-- Step configuration
	step_number INT NOT NULL,
	agent_id TEXT NOT NULL,
	agent_name TEXT NOT NULL,

	-- Tool configuration (per-tool selection)
	selected_tools JSONB NOT NULL DEFAULT '[]'::jsonb,
	tool_approval_mode TEXT DEFAULT 'auto' CHECK (tool_approval_mode IN ('auto', 'manual')),

	-- Input/Output
	user_prompt TEXT,
	previous_context TEXT,
	thread_id TEXT,
	output JSONB,

	-- Execution metadata
	started_at TIMESTAMPTZ,
	completed_at TIMESTAMPTZ,
	status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
	error TEXT,

	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

	UNIQUE(session_id, step_number)
);

-- Create indexes
CREATE INDEX idx_playground_steps_session_id ON playground_steps(session_id);
CREATE INDEX idx_playground_steps_user_id ON playground_steps(user_id);

-- Enable RLS
ALTER TABLE playground_steps ENABLE ROW LEVEL SECURITY;

-- RLS policies for playground_steps
CREATE POLICY "Users can view their own steps"
	ON playground_steps FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own steps"
	ON playground_steps FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own steps"
	ON playground_steps FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own steps"
	ON playground_steps FOR DELETE
	USING (auth.uid() = user_id);

-- Playground templates table
CREATE TABLE playground_templates (
	template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

	-- Template metadata
	name TEXT NOT NULL,
	description TEXT,
	category TEXT,

	-- Template configuration (similar to session structure)
	template_config JSONB NOT NULL,

	-- Sharing
	is_public BOOLEAN DEFAULT FALSE,
	is_official BOOLEAN DEFAULT FALSE,

	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_playground_templates_user_id ON playground_templates(user_id);
CREATE INDEX idx_playground_templates_public ON playground_templates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_playground_templates_category ON playground_templates(category) WHERE category IS NOT NULL;

-- Enable RLS
ALTER TABLE playground_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for playground_templates
CREATE POLICY "Users can view their own templates and public templates"
	ON playground_templates FOR SELECT
	USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can create their own templates"
	ON playground_templates FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
	ON playground_templates FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
	ON playground_templates FOR DELETE
	USING (auth.uid() = user_id);

-- Playground drafts table (for JSON export)
CREATE TABLE playground_drafts (
	draft_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	session_id UUID REFERENCES playground_sessions(session_id) ON DELETE SET NULL,

	name TEXT NOT NULL,
	draft_data JSONB NOT NULL,

	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_playground_drafts_user_id ON playground_drafts(user_id);
CREATE INDEX idx_playground_drafts_session_id ON playground_drafts(session_id);

-- Enable RLS
ALTER TABLE playground_drafts ENABLE ROW LEVEL SECURITY;

-- RLS policies for playground_drafts
CREATE POLICY "Users can view their own drafts"
	ON playground_drafts FOR SELECT
	USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own drafts"
	ON playground_drafts FOR INSERT
	WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own drafts"
	ON playground_drafts FOR UPDATE
	USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own drafts"
	ON playground_drafts FOR DELETE
	USING (auth.uid() = user_id);
