-- Fix existing assistant configurations that have assistant_id set to user_id
-- This migration updates the configurable field to remove the incorrect assistant_id
-- The assistant_id will be set correctly when the assistant is next updated

-- Use a DO block to handle the JSONB operations more explicitly
DO $$
DECLARE
    assistant_record RECORD;
    updated_config jsonb;
BEGIN
    FOR assistant_record IN 
        SELECT assistant_id, config 
        FROM assistant 
        WHERE config->'configurable' ? 'assistant_id'
        AND config->'configurable'->>'assistant_id' = config->'configurable'->>'user_id'
    LOOP
        -- Remove assistant_id from configurable
        updated_config := jsonb_set(
            assistant_record.config,
            '{configurable}',
            (assistant_record.config->'configurable') - 'assistant_id'
        );
        
        -- Update the assistant
        UPDATE assistant 
        SET config = updated_config
        WHERE assistant_id = assistant_record.assistant_id;
    END LOOP;
END $$;

-- Add a comment to track this migration
COMMENT ON TABLE assistant IS 'Assistant configurations updated to remove incorrect assistant_id mappings';
