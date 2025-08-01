/**
 * Multimodal Retrieval System
 * Handles retrieval of relevant multimodal content for chat context
 */

import { createClient } from '@/supabase/server';
import { OpenAIEmbeddings } from '@langchain/openai';

export interface MultimodalContent {
  id: string;
  type: 'attachment' | 'document';
  content: string;
  attachmentId?: string;
  fileName?: string;
  filePath?: string;
  thumbnailPath?: string;
  attachmentType?: string;
  similarity?: number;
  metadata?: Record<string, any>;
}

export interface RetrievalContext {
  query: string;
  threadId?: string;
  agentId?: string;
  limit?: number;
  similarityThreshold?: number;
  includeAttachments?: boolean;
  includeDocuments?: boolean;
}

export class MultimodalRetrieval {
  private embeddings: OpenAIEmbeddings;

  constructor() {
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small',
    });
  }

  /**
   * Retrieve relevant multimodal content based on query
   */
  async retrieveRelevantContent(context: RetrievalContext): Promise<MultimodalContent[]> {
    try {
      const supabase = await createClient();
      const results: MultimodalContent[] = [];

      // Generate embedding for the query
      const queryEmbedding = await this.embeddings.embedQuery(context.query);
      
      // Search in document vectors (only include attachment-related vectors)
      if (context.includeDocuments !== false) {
        const vectorResults = await this.searchDocumentVectors(
          supabase,
          queryEmbedding,
          context
        );
        results.push(...vectorResults);
      }

      // Search in attachment metadata (for files without text content)
      if (context.includeAttachments !== false) {
        const attachmentResults = await this.searchAttachmentMetadata(
          supabase,
          context
        );
        results.push(...attachmentResults);
      }

      // Sort by similarity and limit results
      const sortedResults = results
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, context.limit || 10);

      return sortedResults;

    } catch (error) {
      console.error('Error retrieving multimodal content:', error);
      return [];
    }
  }

  /**
   * Search document vectors using semantic similarity
   */
  private async searchDocumentVectors(
    supabase: any,
    queryEmbedding: number[],
    context: RetrievalContext
  ): Promise<MultimodalContent[]> {
    try {
      // Build the query conditions
      let query = supabase
        .from('document_vectors')
        .select(`
          id,
          content,
          metadata,
          embedding
        `);

      // Add filters based on context
      if (context.agentId) {
        query = query.eq('metadata->agent_id', context.agentId);
      }

      // IMPORTANT: Only search for attachment-related vectors, not knowledgebase documents
      // Knowledgebase documents don't have attachment_id in metadata
      query = query.not('metadata->attachment_id', 'is', null);

      // Execute the query
      const { data: vectors, error } = await query;

      if (error) {
        console.error('Error searching document vectors:', error);
        return [];
      }

      if (!vectors || vectors.length === 0) {
        return [];
      }

      // Calculate similarity for each vector
      const results: MultimodalContent[] = [];
      
      for (const vector of vectors) {
        try {
          // Parse the embedding (stored as PostgreSQL array string)
          const vectorEmbedding = this.parseEmbedding(vector.embedding);
          const similarity = this.cosineSimilarity(queryEmbedding, vectorEmbedding);

          // Only include if above threshold
          if (similarity >= (context.similarityThreshold || 0.7)) {
            const metadata = vector.metadata || {};
            
            // Check if this is from an attachment
            let attachmentInfo = {};
            if (metadata.attachment_id) {
              attachmentInfo = await this.getAttachmentInfo(supabase, metadata.attachment_id);
            }

            results.push({
              id: vector.id,
              type: metadata.attachment_id ? 'attachment' : 'document',
              content: vector.content,
              similarity,
              attachmentId: metadata.attachment_id,
              metadata: {
                ...metadata,
                ...attachmentInfo,
                vector_id: vector.id,
              }
            });
          }
        } catch (embeddingError) {
          console.error('Error processing vector embedding:', embeddingError);
          continue;
        }
      }

      return results;

    } catch (error) {
      console.error('Error in searchDocumentVectors:', error);
      return [];
    }
  }

  /**
   * Search attachment metadata for relevant files
   */
  private async searchAttachmentMetadata(
    supabase: any,
    context: RetrievalContext
  ): Promise<MultimodalContent[]> {
    try {
      let query = supabase
        .from('chat_attachments')
        .select(`
          id,
          original_filename,
          file_path,
          thumbnail_path,
          attachment_type,
          extracted_text,
          metadata,
          thread_id
        `)
        .eq('processing_status', 'completed');

      // Add filters
      if (context.threadId) {
        query = query.eq('thread_id', context.threadId);
      }

      const { data: attachments, error } = await query;

      if (error || !attachments) {
        return [];
      }

      // Simple text matching for attachments without embeddings
      const results: MultimodalContent[] = [];
      const queryLower = context.query.toLowerCase();

      for (const attachment of attachments) {
        let relevanceScore = 0;

        // Check filename relevance
        if (attachment.original_filename.toLowerCase().includes(queryLower)) {
          relevanceScore += 0.8;
        }

        // Check extracted text relevance (simple keyword matching)
        if (attachment.extracted_text) {
          const textLower = attachment.extracted_text.toLowerCase();
          const queryWords = queryLower.split(' ');
          const matchingWords = queryWords.filter(word => 
            word.length > 2 && textLower.includes(word)
          );
          relevanceScore += (matchingWords.length / queryWords.length) * 0.6;
        }

        // Include if relevant enough
        if (relevanceScore >= 0.3) {
          results.push({
            id: attachment.id,
            type: 'attachment',
            content: attachment.extracted_text || `File: ${attachment.original_filename}`,
            attachmentId: attachment.id,
            fileName: attachment.original_filename,
            filePath: attachment.file_path,
            thumbnailPath: attachment.thumbnail_path,
            attachmentType: attachment.attachment_type,
            similarity: relevanceScore,
            metadata: attachment.metadata || {}
          });
        }
      }

      return results;

    } catch (error) {
      console.error('Error in searchAttachmentMetadata:', error);
      return [];
    }
  }

  /**
   * Get attachment information from database
   */
  private async getAttachmentInfo(supabase: any, attachmentId: string): Promise<any> {
    try {
      const { data: attachment } = await supabase
        .from('chat_attachments')
        .select('original_filename, file_path, thumbnail_path, attachment_type')
        .eq('id', attachmentId)
        .single();

      return attachment || {};
    } catch (error) {
      console.error('Error getting attachment info:', error);
      return {};
    }
  }

  /**
   * Parse embedding from PostgreSQL array format
   */
  private parseEmbedding(embeddingStr: string): number[] {
    try {
      // Remove brackets and split by comma
      const cleaned = embeddingStr.replace(/^\[|\]$/g, '');
      return cleaned.split(',').map(val => parseFloat(val.trim()));
    } catch (error) {
      throw new Error(`Failed to parse embedding: ${embeddingStr}`);
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Get attachments for a specific thread
   */
  async getThreadAttachments(threadId: string, userId?: string): Promise<MultimodalContent[]> {
    try {
      const supabase = await createClient();
      
      let query = supabase
        .from('chat_attachments')
        .select(`
          id,
          original_filename,
          file_path,
          thumbnail_path,
          attachment_type,
          extracted_text,
          processing_status,
          metadata,
          created_at
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: attachments, error } = await query;

      if (error || !attachments) {
        return [];
      }

      return attachments.map(attachment => ({
        id: attachment.id,
        type: 'attachment' as const,
        content: attachment.extracted_text || `File: ${attachment.original_filename}`,
        attachmentId: attachment.id,
        fileName: attachment.original_filename,
        filePath: attachment.file_path,
        thumbnailPath: attachment.thumbnail_path,
        attachmentType: attachment.attachment_type,
        metadata: {
          ...attachment.metadata,
          processing_status: attachment.processing_status,
          created_at: attachment.created_at
        }
      }));

    } catch (error) {
      console.error('Error getting thread attachments:', error);
      return [];
    }
  }

  /**
   * Format multimodal content for chat context
   */
  formatForChatContext(contents: MultimodalContent[]): string {
    if (contents.length === 0) {
      return '';
    }

    const formatted = contents.map(content => {
      const prefix = content.type === 'attachment' 
        ? `[${content.attachmentType?.toUpperCase()} FILE: ${content.fileName}]`
        : `[DOCUMENT]`;
      
      return `${prefix}\n${content.content}\n`;
    });

    return `\n=== RELEVANT MULTIMODAL CONTENT ===\n${formatted.join('\n')}\n=== END MULTIMODAL CONTENT ===\n`;
  }
}

export const multimodalRetrieval = new MultimodalRetrieval();