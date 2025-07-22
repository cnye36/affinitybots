-- Create chat files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true);

-- Set up security policies for chat files bucket
CREATE POLICY "Chat files are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-files');

CREATE POLICY "Users can upload their own chat files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own chat files"
ON storage.objects FOR UPDATE
WITH CHECK (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own chat files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'chat-files'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
