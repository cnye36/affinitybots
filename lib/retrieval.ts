import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { Document } from "@langchain/core/documents";
import { multimodalRetrieval } from "./multimodal/retrieval";

/**
 * Retrieves the top K most relevant documents based on the query.
 *
 * @param {string} query - The user's input query.
 * @param {SupabaseClient} supabase - The Supabase client instance.
 * @param {string} assistantId - The ID of the assistant to filter documents by.
 * @param {number} topK - The number of top documents to retrieve.
 * @returns {Promise<Document[]>} - An array of relevant documents.
 */
export async function retrieveRelevantDocuments(
  query: string,
  supabase: SupabaseClient,
  topK: number = 5,
  assistantId?: string
): Promise<Document[]> {
  const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });

  try {
    // Get traditional document vectors from knowledgebase ONLY
    const filter: Record<string, unknown> = {};
    if (assistantId) {
      filter.assistant_id = assistantId;
    }

    const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
      client: supabase,
      tableName: "document_vectors",
      queryName: "match_documents",
      filter: filter,
    });

    const similarDocs = await vectorStore.similaritySearch(query, topK);
    
    // Mark these as knowledgebase documents
    return similarDocs.map(doc => new Document({
      pageContent: doc.pageContent,
      metadata: {
        ...doc.metadata,
        source: 'knowledgebase',
        scope: 'assistant' // Available across all threads for this assistant
      }
    }));

  } catch (error) {
    console.error('Error in retrieveRelevantDocuments:', error);
    return [];
  }
}

/**
 * Retrieve thread-scoped attachments (multimodal, not persistent across threads)
 * This is for files uploaded via /api/chat-attachments with thread_id
 */
export async function retrieveThreadAttachments(
  query: string,
  supabase: SupabaseClient,
  threadId: string,
  assistantId?: string,
  topK: number = 5
): Promise<Document[]> {
  try {
    const multimodalContent = await multimodalRetrieval.retrieveRelevantContent({
      query,
      assistantId: assistantId,
      threadId,
      limit: topK,
      similarityThreshold: 0.6,
      includeAttachments: true,
      includeDocuments: false // Thread attachments only, not knowledgebase docs
    });

    // Convert multimodal content to Document format
    return multimodalContent.map(content => new Document({
      pageContent: content.content,
      metadata: {
        ...content.metadata,
        source: 'thread_attachment',
        scope: 'thread', // Only available in this thread
        attachment_id: content.attachmentId,
        file_name: content.fileName,
        attachment_type: content.attachmentType,
        similarity: content.similarity
      }
    }));

  } catch (error) {
    console.error('Error retrieving thread attachments:', error);
    return [];
  }
}

/**
 * Combined retrieval: knowledgebase + thread attachments
 * Use this when you want both long-term knowledge and thread-scoped attachments
 */
export async function retrieveAllRelevantContent(
  query: string,
  supabase: SupabaseClient,
  assistantId?: string,
  threadId?: string,
  topK: number = 5
): Promise<{
  knowledgebase: Document[];
  threadAttachments: Document[];
  combined: Document[];
}> {
  const results = {
    knowledgebase: [] as Document[],
    threadAttachments: [] as Document[],
    combined: [] as Document[]
  };

  try {
    // Get knowledgebase documents (always available)
    if (assistantId) {
      const kbLimit = threadId ? Math.floor(topK * 0.7) : topK;
      results.knowledgebase = await retrieveRelevantDocuments(query, supabase, kbLimit, assistantId);
    }

    // Get thread attachments (only if threadId provided)
    if (threadId) {
      const attachmentLimit = Math.floor(topK * 0.3);
      results.threadAttachments = await retrieveThreadAttachments(
        query, 
        supabase, 
        threadId, 
        assistantId, 
        attachmentLimit
      );
    }

    // Combine and sort by relevance
    results.combined = [...results.knowledgebase, ...results.threadAttachments]
      .sort((a, b) => {
        const aScore = a.metadata?.similarity || 0;
        const bScore = b.metadata?.similarity || 0;
        return bScore - aScore;
      })
      .slice(0, topK);

    return results;

  } catch (error) {
    console.error('Error in retrieveAllRelevantContent:', error);
    return results;
  }
}

/**
 * Get all attachments for a specific thread (for display purposes)
 */
export async function getThreadAttachments(
  threadId: string,
  userId?: string
) {
  return await multimodalRetrieval.getThreadAttachments(threadId, userId);
}

/**
 * Format multimodal content for chat context
 */
export function formatMultimodalContext(documents: Document[]): string {
  const multimodalDocs = documents.filter(doc => doc.metadata?.source === 'multimodal');
  
  if (multimodalDocs.length === 0) {
    return '';
  }

  const content = multimodalDocs.map(doc => ({
    id: doc.metadata?.attachment_id || doc.metadata?.id,
    type: doc.metadata?.type,
    content: doc.pageContent,
    fileName: doc.metadata?.file_name,
    attachmentType: doc.metadata?.attachment_type,
    similarity: doc.metadata?.similarity,
    metadata: doc.metadata
  }));

  return multimodalRetrieval.formatForChatContext(content);
}
