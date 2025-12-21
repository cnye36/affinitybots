-- SQL functions for usage tracking

-- Function to increment agent count
CREATE OR REPLACE FUNCTION increment_agent_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_usage_limits (user_id, agent_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    agent_count = public.user_usage_limits.agent_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement agent count
CREATE OR REPLACE FUNCTION decrement_agent_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_usage_limits
  SET
    agent_count = GREATEST(0, agent_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment active workflow count
CREATE OR REPLACE FUNCTION increment_active_workflow_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_usage_limits (user_id, active_workflow_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    active_workflow_count = public.user_usage_limits.active_workflow_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement active workflow count
CREATE OR REPLACE FUNCTION decrement_active_workflow_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_usage_limits
  SET
    active_workflow_count = GREATEST(0, active_workflow_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment draft workflow count
CREATE OR REPLACE FUNCTION increment_draft_workflow_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_usage_limits (user_id, draft_workflow_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    draft_workflow_count = public.user_usage_limits.draft_workflow_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement draft workflow count
CREATE OR REPLACE FUNCTION decrement_draft_workflow_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_usage_limits
  SET
    draft_workflow_count = GREATEST(0, draft_workflow_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment integration count
CREATE OR REPLACE FUNCTION increment_integration_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_usage_limits (user_id, integration_count)
  VALUES (p_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET
    integration_count = public.user_usage_limits.integration_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement integration count
CREATE OR REPLACE FUNCTION decrement_integration_count(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.user_usage_limits
  SET
    integration_count = GREATEST(0, integration_count - 1),
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update AI usage after a request
CREATE OR REPLACE FUNCTION update_ai_usage(
  p_user_id UUID,
  p_input_tokens BIGINT,
  p_output_tokens BIGINT,
  p_actual_cost DECIMAL(10, 6),
  p_charged_cost DECIMAL(10, 6)
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_usage_limits (
    user_id,
    monthly_tokens_input,
    monthly_tokens_output,
    monthly_actual_cost_usd,
    monthly_charged_cost_usd
  )
  VALUES (
    p_user_id,
    p_input_tokens,
    p_output_tokens,
    p_actual_cost,
    p_charged_cost
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    monthly_tokens_input = public.user_usage_limits.monthly_tokens_input + p_input_tokens,
    monthly_tokens_output = public.user_usage_limits.monthly_tokens_output + p_output_tokens,
    monthly_actual_cost_usd = public.user_usage_limits.monthly_actual_cost_usd + p_actual_cost,
    monthly_charged_cost_usd = public.user_usage_limits.monthly_charged_cost_usd + p_charged_cost,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_agent_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_agent_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_active_workflow_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_active_workflow_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_draft_workflow_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_draft_workflow_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_integration_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_integration_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_ai_usage(UUID, BIGINT, BIGINT, DECIMAL, DECIMAL) TO authenticated;
