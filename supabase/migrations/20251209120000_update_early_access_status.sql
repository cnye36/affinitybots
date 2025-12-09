-- Migration to update early_access_invites status constraint
-- Dropping the constraint requires knowing its name. 
-- Postgres usually names it table_column_check.

DO $$
DECLARE 
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'early_access_invites'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) LIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE early_access_invites DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

ALTER TABLE early_access_invites 
ADD CONSTRAINT early_access_invites_status_check 
CHECK (status IN ('requested', 'invited', 'approved', 'accepted', 'expired', 'declined'));
