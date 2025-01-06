// lib/retrieval.ts
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient as createSupabaseClient } from "@/utils/supabase/server";
import { Document } from "@langchain/core/documents";

/**
 * Retrieves the top K most relevant documents based on the query.
 *
 * @param {string} query - The user's input query.
 * @param {number} topK - The number of top documents to retrieve.
 * @returns {Promise<Document[]>} - An array of relevant documents.
 */
export async function retrieveRelevantDocuments(
  query: string,
  topK: number = 5
): Promise<Document[]> {
  const supabase = await createSupabaseClient();
  const embeddings = new OpenAIEmbeddings();

  const vectorStore = await SupabaseVectorStore.fromExistingIndex(embeddings, {
    client: supabase,
    tableName: "document_vectors",
  });

  const similarDocs = await vectorStore.similaritySearch(query, topK);
  return similarDocs;
}
