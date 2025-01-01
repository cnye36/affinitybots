import { QdrantClient } from '@qdrant/js-client-rest'
import { QdrantVectorStore } from '@langchain/qdrant'
import { OpenAIEmbeddings } from '@langchain/openai'

const client = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
})

export async function createCollection(collectionName: string) {
  try {
    await client.createCollection(collectionName, {
      vectors: {
        size: 1536, // OpenAI embeddings dimension
        distance: 'Cosine',
      },
    })
    return true
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      return true
    }
    console.error('Error creating collection:', error)
    return false
  }
}

export async function storeEmbeddings(
  texts: string[],
  metadata: Record<string, any>[],
  collectionName: string
) {
  const embeddings = new OpenAIEmbeddings()
  const embeddingVectors = await embeddings.embedDocuments(texts)

  const points = embeddingVectors.map((vector, index) => ({
    id: metadata[index].source, // Ensure unique external IDs
    vector,
    payload: metadata[index],
  }))

  await client.upsert(collectionName, {
    points,
  })

  return true
}

export async function searchSimilar(
  query: string,
  collectionName: string,
  limit: number = 5
) {
  const embeddings = new OpenAIEmbeddings()
  
  const vectorStore = new QdrantVectorStore(embeddings, {
    client,
    collectionName,
  })

  const results = await vectorStore.similaritySearch(query, limit)
  return results
}

export async function deleteEmbedding(
  collectionName: string,
  externalId: string
) {
  try {
    await client.delete(
      collectionName,
      { points: [externalId] }
    )
    return true
  } catch (error) {
    console.error('Error deleting embedding:', error)
    return false
  }
}

export { client } 