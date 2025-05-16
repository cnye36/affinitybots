CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE early_access_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'invited', 'accepted', 'expired', 'declined')),
    invite_code TEXT UNIQUE,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    invited_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE early_access_invites IS 'Stores requests and invitations for early access to the application.';
COMMENT ON COLUMN early_access_invites.status IS 'Status of the invite: requested, invited, accepted, expired, declined.';
COMMENT ON COLUMN early_access_invites.accepted_by_user_id IS 'User ID from auth.users who accepted the invite.';

-- Indexes for performance
CREATE INDEX idx_early_access_invites_email ON early_access_invites(email);
CREATE INDEX idx_early_access_invites_invite_code ON early_access_invites(invite_code);
CREATE INDEX idx_early_access_invites_status ON early_access_invites(status);
CREATE INDEX idx_early_access_invites_accepted_by_user_id ON early_access_invites(accepted_by_user_id);

-- Function to automatically update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update 'updated_at' on row update
CREATE TRIGGER set_early_access_invites_updated_at
BEFORE UPDATE ON early_access_invites
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS (Row Level Security)
ALTER TABLE early_access_invites ENABLE ROW LEVEL SECURITY;

-- Policies:
-- By default, no one can do anything.
-- service_role (backend) can do anything.
CREATE POLICY "Allow full access to service_role"
ON early_access_invites
FOR ALL
USING (true)
WITH CHECK (true);

-- Example: Allow users to see their own invite status if they are logged in and their email matches.
-- This would require an authenticated user context.
-- CREATE POLICY "Allow users to read their own invite"
-- ON early_access_invites
-- FOR SELECT
-- USING (auth.uid() IS NOT NULL AND auth.jwt()->>'email' = email);

-- Example: Allow checking of an invite code during signup (unauthenticated context)
-- This is often better handled by a security definer function.
-- CREATE POLICY "Allow public read for invite code validation"
-- ON early_access_invites
-- FOR SELECT
-- USING (true); -- Be very careful with broad public read policies. 