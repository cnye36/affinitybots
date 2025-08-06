-- Fix document_vectors RLS policies to work with current data structure
-- Run this SQL in your Supabase dashboard

-- First drop the existing policies
DROP POLICY IF EXISTS "Users can insert document vectors for their agents" ON document_vectors;
DROP POLICY IF EXISTS "Users can view their own document vectors" ON document_vectors;
DROP POLICY IF EXISTS "Users can update their own document vectors" ON document_vectors;
DROP POLICY IF EXISTS "Users can delete their own document vectors" ON document_vectors;

-- Create new policies that work with the current data structure
-- For INSERT: Allow users to insert document vectors for documents belonging to their agents
CREATE POLICY "Allow users to insert document vectors for their agents" ON document_vectors
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM documents d
    JOIN agent a ON d.agent_id = a.id
    WHERE d.id::text = (metadata->>'document_id')
    AND (a.user_id = auth.uid() OR (a.metadata->>'owner_id')::uuid = auth.uid())
  )
);

-- For SELECT: Allow users to view document vectors for documents belonging to their agents
CREATE POLICY "Allow users to view document vectors for their agents" ON document_vectors
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM documents d
    JOIN agent a ON d.agent_id = a.id
    WHERE d.id::text = (metadata->>'document_id')
    AND (a.user_id = auth.uid() OR (a.metadata->>'owner_id')::uuid = auth.uid())
  )
);

-- For UPDATE: Allow users to update document vectors for documents belonging to their agents
CREATE POLICY "Allow users to update document vectors for their agents" ON document_vectors
FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM documents d
    JOIN agent a ON d.agent_id = a.id
    WHERE d.id::text = (metadata->>'document_id')
    AND (a.user_id = auth.uid() OR (a.metadata->>'owner_id')::uuid = auth.uid())
  )
);

-- For DELETE: Allow users to delete document vectors for documents belonging to their agents
CREATE POLICY "Allow users to delete document vectors for their agents" ON document_vectors
FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM documents d
    JOIN agent a ON d.agent_id = a.id
    WHERE d.id::text = (metadata->>'document_id')
    AND (a.user_id = auth.uid() OR (a.metadata->>'owner_id')::uuid = auth.uid())
  )
);