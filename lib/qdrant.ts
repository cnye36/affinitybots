import { QdrantClient } from '@qdrant/js-client-rest'
import { QdrantVectorStore } from '@langchain/qdrant'
import { OpenAIEmbeddings } from '@langchain/openai'
import { v4 as uuidv4 } from 'uuid'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set in environment variables')
}

// Initialize OpenAI embeddings with API key
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'text-embedding-3-small', // Explicitly specify the model
  batchSize: 512, // Process more texts at once
  stripNewLines: true, // Clean text before embedding
})

// Use cloud configuration if QDRANT_URL is set, otherwise use local Docker
const client = new QdrantClient(
  process.env.QDRANT_URL
    ? {
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
        timeout: 60000, // 60 second timeout
      }
    : {
        url: 'http://localhost:6333',
        timeout: 60000, // 60 second timeout
      }
)

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
  try {
    // Create embeddings using OpenAI
    console.log('Creating embeddings for', texts.length, 'chunks')
    const embeddingVectors = await embeddings.embedDocuments(texts)
    console.log('Successfully created embeddings')

    // Format points according to Qdrant's expected structure
    const points = embeddingVectors.map((vector, index) => ({
      id: uuidv4(),
      vector: vector,
      payload: {
        ...metadata[index],
        text: texts[index],
      }
    }))

    // Break points into smaller batches to avoid connection issues
    const batchSize = 100
    console.log('Storing embeddings in batches of', batchSize)
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize)
      await client.upsert(collectionName, {
        wait: true, // Wait for operation to complete
        points: batch
      })
      console.log(`Stored batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(points.length/batchSize)}`)
    }

    return true
  } catch (error) {
    console.error('Detailed error in storeEmbeddings:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      cause: error instanceof Error ? error.cause : undefined
    })
    throw error
  }
}

export async function searchSimilar(
  query: string,
  collectionName: string,
  limit: number = 5
) {
  // Use the same embeddings instance for consistency
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