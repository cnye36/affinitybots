import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseClient } from "@supabase/supabase-js";
import { Document } from "@langchain/core/documents";

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
  agentId?: string
): Promise<Document[]> {
  const embeddings = new OpenAIEmbeddings();

  const filter: Record<string, unknown> = {};
  if (agentId) {
    filter.agent_id = agentId;
  }

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "document_vectors",
    queryName: "match_documents",
    filter: filter,
  });

  const similarDocs = await vectorStore.similaritySearch(query, topK);
  return similarDocs;
}
