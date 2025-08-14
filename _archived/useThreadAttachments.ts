import { useState, useEffect } from 'react';
import { createClient } from '@/supabase/client';

interface ThreadAttachment {
  id: string;
  original_filename: string;
  file_size: number;
  attachment_type: 'image' | 'document' | 'video' | 'audio' | 'archive' | 'other';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnail_path?: string;
  file_path: string;
  created_at: string;
}

export function useThreadAttachments(threadId?: string) {
  const [attachments, setAttachments] = useState<ThreadAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId) {
      setAttachments([]);
      return;
    }

    const fetchAttachments = async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('chat_attachments')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        setAttachments(data || []);
      } catch (err) {
        console.error('Error fetching thread attachments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch attachments');
      } finally {
        setLoading(false);
      }
    };

    fetchAttachments();
  }, [threadId]);

  const getThumbnailUrl = (attachment: ThreadAttachment): string | undefined => {
    if (!attachment.thumbnail_path) return undefined;
    
    const supabase = createClient();
    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(attachment.thumbnail_path);
    
    return data.publicUrl;
  };

  const getFileUrl = (attachment: ThreadAttachment): string => {
    const supabase = createClient();
    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(attachment.file_path);
    
    return data.publicUrl;
  };

  return {
    attachments,
    loading,
    error,
    getThumbnailUrl,
    getFileUrl,
  };
}