-- Fix permissions for auth triggers by adding SECURITY DEFINER
-- This ensures the triggers run with the privileges of the function creator (postgres),
-- allowing them to insert into public tables when triggered by auth event.

-- Update initialize_user_subscription
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status, trial_start, trial_end)
  VALUES (
    NEW.id,
    'free',
    'trialing',
    NOW(),
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update initialize_user_usage_limits
CREATE OR REPLACE FUNCTION initialize_user_usage_limits()
RETURNS TRIGGER 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO user_usage_limits (
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
