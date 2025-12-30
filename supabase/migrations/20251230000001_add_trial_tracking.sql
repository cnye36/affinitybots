-- Add column to track if user has ever had a trial
-- This prevents users from getting multiple free trials
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS had_trial BOOLEAN DEFAULT false;

-- Set had_trial to true for all existing users who have trial_start or trial_end
UPDATE subscriptions
SET had_trial = true
WHERE trial_start IS NOT NULL OR trial_end IS NOT NULL;

-- Update the initialize_user_subscription function to set had_trial
CREATE OR REPLACE FUNCTION initialize_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, plan_type, status, trial_start, trial_end, had_trial)
  VALUES (
    NEW.id,
    'free',
    'trialing',
    NOW(),
    NOW() + INTERVAL '14 days',
    true  -- Mark that they've used their trial
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON COLUMN subscriptions.had_trial IS 'Tracks if user has ever had a free trial to prevent duplicate trials';
