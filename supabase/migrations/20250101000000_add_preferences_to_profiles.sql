-- Add preferences column to profiles table
-- This column stores user preferences like view modes, settings, etc.

-- Add preferences column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'preferences'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN preferences JSONB DEFAULT NULL;
    END IF;
END $$;

-- Add a comment to document the column
COMMENT ON COLUMN public.profiles.preferences IS 'User preferences stored as JSONB (e.g., viewMode settings for different sections)';

