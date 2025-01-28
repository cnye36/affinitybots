-- Drop old indexes if they exist
DROP INDEX IF EXISTS documents_agent_id_idx;
DROP INDEX IF EXISTS document_vectors_metadata_agent_id_idx;

-- Create new indexes if they don't exist
CREATE INDEX IF NOT EXISTS documents_assistant_id_idx ON documents(assistant_id);
CREATE INDEX IF NOT EXISTS document_vectors_metadata_assistant_id_idx ON document_vectors((metadata->>'assistant_id'));

-- Update any remaining document vectors metadata that might still reference agent_id
UPDATE document_vectors
SET metadata = jsonb_set(
  metadata,
  '{assistant_id}',
  metadata->'agent_id'
)
WHERE metadata->>'agent_id' IS NOT NULL 
AND metadata->>'assistant_id' IS NULL;

-- Clean up old agent_id references in metadata
UPDATE document_vectors
SET metadata = metadata - 'agent_id'
WHERE metadata->>'agent_id' IS NOT NULL; 