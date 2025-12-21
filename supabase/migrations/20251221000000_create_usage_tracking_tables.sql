-- Create user_usage_limits table
-- Tracks current resource usage and limits per user
CREATE TABLE IF NOT EXISTS public.user_usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Resource counts
  agent_count INTEGER NOT NULL DEFAULT 0,
  active_workflow_count INTEGER NOT NULL DEFAULT 0,
  draft_workflow_count INTEGER NOT NULL DEFAULT 0,
  integration_count INTEGER NOT NULL DEFAULT 0,

  -- Monthly AI usage (resets monthly)
  monthly_tokens_input BIGINT NOT NULL DEFAULT 0,
  monthly_tokens_output BIGINT NOT NULL DEFAULT 0,
  monthly_actual_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
  monthly_charged_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,

  -- Reset tracking
  last_monthly_reset TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
  current_month TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM'),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_usage_limits_user_id_key UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_usage_limits_user_id_idx ON public.user_usage_limits(user_id);
CREATE INDEX IF NOT EXISTS user_usage_limits_current_month_idx ON public.user_usage_limits(current_month);

-- Enable RLS
ALTER TABLE public.user_usage_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage limits"
  ON public.user_usage_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage limits"
  ON public.user_usage_limits
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all (for system updates)
CREATE POLICY "Service role can manage all usage limits"
  ON public.user_usage_limits
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create ai_usage_logs table
-- Detailed log of every AI request for billing and analytics
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Model information
  model_id TEXT NOT NULL,
  llm_id TEXT, -- Full ID with provider (e.g., "openai:gpt-5.2")

  -- Token usage
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost tracking
  actual_cost_usd DECIMAL(10, 6) NOT NULL, -- What we pay
  charged_cost_usd DECIMAL(10, 6) NOT NULL, -- What user pays
  profit_usd DECIMAL(10, 6) GENERATED ALWAYS AS (charged_cost_usd - actual_cost_usd) STORED,

  -- Attribution (what generated this request)
  agent_id TEXT,
  workflow_run_id UUID,
  session_id TEXT,

  -- Request metadata
  request_type TEXT DEFAULT 'chat', -- 'chat', 'workflow', 'generation', etc.
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Partition key for efficient querying
  year_month TEXT NOT NULL DEFAULT TO_CHAR(NOW(), 'YYYY-MM')
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_idx ON public.ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_user_id_year_month_idx ON public.ai_usage_logs(user_id, year_month);
CREATE INDEX IF NOT EXISTS ai_usage_logs_agent_id_idx ON public.ai_usage_logs(agent_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_workflow_run_id_idx ON public.ai_usage_logs(workflow_run_id);
CREATE INDEX IF NOT EXISTS ai_usage_logs_created_at_idx ON public.ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_usage_logs_year_month_idx ON public.ai_usage_logs(year_month);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all (for system inserts)
CREATE POLICY "Service role can manage all usage logs"
  ON public.ai_usage_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_usage_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_user_usage_limits_updated_at
  BEFORE UPDATE ON public.user_usage_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_limits_updated_at();

-- Function to initialize usage limits for new users
CREATE OR REPLACE FUNCTION initialize_user_usage_limits()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_usage_limits (
    user_id,
    agent_count,
    active_workflow_count,
    draft_workflow_count,
    integration_count,
    monthly_tokens_input,
    monthly_tokens_output,
    monthly_actual_cost_usd,
    monthly_charged_cost_usd,
    last_monthly_reset,
    current_month
  )
  VALUES (
    NEW.id,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    DATE_TRUNC('month', NOW()),
    TO_CHAR(NOW(), 'YYYY-MM')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create usage limits on user signup
CREATE TRIGGER create_user_usage_limits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_usage_limits();

-- Function to reset monthly usage (to be called by cron job on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void AS $$
DECLARE
  current_month_str TEXT := TO_CHAR(NOW(), 'YYYY-MM');
BEGIN
  UPDATE public.user_usage_limits
  SET
    monthly_tokens_input = 0,
    monthly_tokens_output = 0,
    monthly_actual_cost_usd = 0,
    monthly_charged_cost_usd = 0,
    last_monthly_reset = DATE_TRUNC('month', NOW()),
    current_month = current_month_str
  WHERE current_month != current_month_str;

  RAISE NOTICE 'Reset monthly usage for % users', (SELECT COUNT(*) FROM public.user_usage_limits WHERE current_month = current_month_str);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.user_usage_limits IS 'Tracks current resource usage and limits per user';
COMMENT ON TABLE public.ai_usage_logs IS 'Detailed log of every AI request for billing and analytics';
COMMENT ON COLUMN public.user_usage_limits.monthly_actual_cost_usd IS 'What we pay to AI providers';
COMMENT ON COLUMN public.user_usage_limits.monthly_charged_cost_usd IS 'What the user pays (includes markup)';
COMMENT ON COLUMN public.ai_usage_logs.actual_cost_usd IS 'Our cost to AI provider';
COMMENT ON COLUMN public.ai_usage_logs.charged_cost_usd IS 'What user is charged (includes markup)';
COMMENT ON FUNCTION reset_monthly_usage() IS 'Resets monthly usage counters on the 1st of each month. Call via cron job.';
