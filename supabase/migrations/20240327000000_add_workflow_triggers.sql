-- Create enum type for trigger types
DO $$ BEGIN
    CREATE TYPE trigger_type AS ENUM ('manual', 'webhook', 'form', 'integration');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add triggers table
CREATE TABLE IF NOT EXISTS workflow_triggers (
    trigger_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(workflow_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type trigger_type NOT NULL DEFAULT 'manual',
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Add indexes and RLS
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_workflow ON workflow_triggers(workflow_id);
ALTER TABLE IF NOT EXISTS workflow_triggers ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their own workflow triggers"
ON workflow_triggers
USING (workflow_id IN (
    SELECT workflow_id FROM workflows WHERE owner_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER set_workflow_triggers_updated_at
    BEFORE UPDATE ON workflow_triggers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 