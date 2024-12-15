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
  } catch (error) {
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
  
  const vectorStore = await QdrantVectorStore.fromTexts(
    texts,
    metadata,
    embeddings,
    {
      client,
      collectionName,
    }
  )

  return vectorStore
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

export { client } 