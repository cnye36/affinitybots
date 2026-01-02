-- Add activated_at column to track when workflow was activated
-- Used for enforcing plan limits (deactivate oldest workflows first)
ALTER TABLE workflows
ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance when ordering by activation date
CREATE INDEX IF NOT EXISTS idx_workflows_activated_at ON workflows(activated_at);

-- Comment
COMMENT ON COLUMN workflows.activated_at IS 'Timestamp when workflow was last activated. Used for enforcing plan limits.';
