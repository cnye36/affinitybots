-- Add foreign key constraints to document_vectors
ALTER TABLE document_vectors
ADD COLUMN agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
ADD COLUMN document_id uuid REFERENCES documents(id) ON DELETE CASCADE;

-- Create an index on the embedding column for faster similarity search
CREATE INDEX document_vectors_embedding_idx ON document_vectors 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search for similar documents
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.8,
  match_count int DEFAULT 5,
  agent_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_vectors.id,
    document_vectors.content,
    document_vectors.metadata,
    1 - (document_vectors.embedding <=> query_embedding) as similarity
  FROM document_vectors
  WHERE
    -- Filter by agent if provided
    (agent_id IS NULL OR document_vectors.agent_id = agent_id)
    -- Filter by similarity threshold
    AND 1 - (document_vectors.embedding <=> query_embedding) > match_threshold
  ORDER BY document_vectors.embedding <=> query_embedding
  LIMIT match_count;
END;
$$; 