import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { client as qdrantClient, storeEmbeddings, createCollection } from '@/lib/qdrant'
import { createClient } from '@/utils/supabase/server'
import fs from 'fs'
import axios from 'axios'
import { writeFile } from 'fs/promises'
import path from 'path'

// Function to split text into chunks
function splitIntoChunks(text: string, chunkSize: number = 500): string[] {
  const words = text.split(/\s+/)
  const chunks: string[] = []
  let currentChunk: string[] = []
  let currentSize = 0

  for (const word of words) {
    if (currentSize + word.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))
      currentChunk = []
      currentSize = 0
    }
    currentChunk.push(word)
    currentSize += word.length + 1 // +1 for space
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  return chunks
}

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params.id

  try {
    console.log('Starting file upload process for agent:', id)
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const url = formData.get('url') as string | null

    const agentId = id
    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required.' }, { status: 400 })
    }

    // Ensure the Qdrant collection exists
    const collectionName = `agent_${agentId}_knowledge`
    console.log('Checking Qdrant collection:', collectionName)
    const collectionExists = await qdrantClient.getCollection(collectionName)
      .then(() => true)
      .catch((err) => {
        console.error('Error checking collection:', err)
        return false
      })

    if (!collectionExists) {
      console.log('Creating new collection')
      const created = await createCollection(collectionName)
      if (!created) {
        throw new Error('Failed to create Qdrant collection.')
      }
    }

    let entry
    let textContent: string
    let sourceId: string

    if (file) {
      console.log('Processing file upload:', file.name)
      // Handle file upload
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const uniqueFilename = `${uuidv4()}-${file.name}`
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      
      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      
      const filePath = `/uploads/${uniqueFilename}`
      const fullPath = path.join(process.cwd(), 'public', filePath)
      await writeFile(fullPath, buffer)
      console.log('File saved to:', fullPath)

      entry = {
        id: uuidv4(),
        type: 'document',
        name: file.name,
        filePath,
        uploadedAt: new Date().toISOString(),
        agent_id: agentId,
      }

      // Extract text from the document
      textContent = fs.readFileSync(fullPath, 'utf-8')
      sourceId = filePath
    } else if (url) {
      console.log('Processing URL:', url)
      // Handle URL indexing
      entry = {
        id: uuidv4(),
        type: 'url',
        url,
        indexedAt: new Date().toISOString(),
        agent_id: agentId,
      }

      // Fetch and process the URL content
      const response = await axios.get(url)
      textContent = response.data
      sourceId = url
    } else {
      return NextResponse.json({ error: 'No file or URL provided.' }, { status: 400 })
    }

    // Split content into chunks
    console.log('Splitting content into chunks')
    const chunks = splitIntoChunks(textContent)
    
    // Create metadata for each chunk
    const metadata = chunks.map((_, index) => ({
      source: sourceId,
      chunk_index: index,
      total_chunks: chunks.length,
      document_id: entry.id
    }))

    // Store embeddings in Qdrant
    console.log('Storing embeddings in Qdrant')
    await storeEmbeddings(chunks, metadata, collectionName)
    console.log('Successfully stored embeddings')

    // Update the agent's knowledge base in Supabase
    console.log('Updating Supabase with entry:', entry)
    const supabase = await createClient()
    const { data, error: updateError } = await supabase
      .from('knowledge')
      .insert([entry])

    if (updateError) {
      console.error('Supabase update error:', updateError)
      throw updateError
    }
    console.log('Successfully updated Supabase')

    return NextResponse.json({ success: true, entry })
  } catch (error) {
    console.error('Detailed error in upload route:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      cause: error instanceof Error ? error.cause : undefined
    })
    return NextResponse.json({ 
      error: 'Failed to upload knowledge.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}