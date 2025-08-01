-- Create comprehensive chat attachments system
-- This migration creates the database schema for multimodal chat attachments from scratch

-- Create enum for file types (drop if exists to handle re-runs)
DROP TYPE IF EXISTS attachment_type CASCADE;
CREATE TYPE attachment_type AS ENUM (
  'image',
  'document', 
  'video',
  'audio',
  'archive',
  'other'
);

-- Create enum for processing status (drop if exists to handle re-runs)
DROP TYPE IF EXISTS processing_status CASCADE;
CREATE TYPE processing_status AS ENUM (
  'pending',
  'processing', 
  'completed',
  'failed'
);

-- Create chat_attachments table
CREATE TABLE IF NOT EXISTS chat_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID, -- Made nullable since chat_threads might not exist yet
  message_id UUID, -- Optional reference to specific message
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- File metadata
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL, -- Path in storage bucket
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  attachment_type attachment_type NOT NULL,
  
  -- Processing information
  processing_status processing_status DEFAULT 'pending',
  processing_error TEXT,
  
  -- Generated content
  thumbnail_path TEXT, -- For images/videos
  extracted_text TEXT, -- For documents/OCR
  
  -- Embeddings reference (nullable in case document_vectors doesn't exist yet)
  document_vector_id UUID, -- Made nullable to avoid foreign key errors
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_attachments_thread_id ON chat_attachments(thread_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_user_id ON chat_attachments(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_type ON chat_attachments(attachment_type);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_status ON chat_attachments(processing_status);
CREATE INDEX IF NOT EXISTS idx_chat_attachments_created_at ON chat_attachments(created_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at trigger
DROP TRIGGER IF EXISTS update_chat_attachments_updated_at ON chat_attachments;
CREATE TRIGGER update_chat_attachments_updated_at
  BEFORE UPDATE ON chat_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE chat_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own attachments" ON chat_attachments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own attachments" ON chat_attachments
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own attachments" ON chat_attachments
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own attachments" ON chat_attachments
  FOR DELETE USING (user_id = auth.uid());

-- Create storage bucket for chat-attachments (fresh setup)
-- First, remove any existing bucket with this name
DELETE FROM storage.objects WHERE bucket_id = 'chat-attachments';
DELETE FROM storage.buckets WHERE id = 'chat-attachments';

-- Also clean up old chat-files bucket if it exists
DELETE FROM storage.objects WHERE bucket_id = 'chat-files';
DELETE FROM storage.buckets WHERE id = 'chat-files';

-- Create fresh bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments', 
  'chat-attachments', 
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'text/markdown',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/zip', 'application/json'
  ]
);

-- Drop any existing policies (clean slate)
DROP POLICY IF EXISTS "Chat files are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat files" ON storage.objects;
DROP POLICY IF EXISTS "Chat attachments are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own chat attachments" ON storage.objects;

CREATE POLICY "Chat attachments are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can upload their own chat attachments" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-attachments' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own chat attachments" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'chat-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own chat attachments" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chat-attachments'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Function to determine attachment type from mime type
CREATE OR REPLACE FUNCTION get_attachment_type(mime_type TEXT)
RETURNS attachment_type AS $$
BEGIN
  CASE
    WHEN mime_type LIKE 'image/%' THEN RETURN 'image';
    WHEN mime_type IN (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'text/markdown'
    ) THEN RETURN 'document';
    WHEN mime_type LIKE 'video/%' THEN RETURN 'video';
    WHEN mime_type LIKE 'audio/%' THEN RETURN 'audio';
    WHEN mime_type IN ('application/zip', 'application/x-rar-compressed') THEN RETURN 'archive';
    ELSE RETURN 'other';
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;