import type { NextApiRequest, NextApiResponse } from 'next'
import { v4 as uuidv4 } from 'uuid'
import { client as qdrantClient, storeEmbeddings, createCollection } from '@/lib/qdrant'
import { createClient } from '@/utils/supabase/server'
import formidable from 'formidable'
import fs from 'fs'
import axios from 'axios'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (req.method === 'POST') {
    const form = new formidable.IncomingForm()
    form.parse(req, async (err: any, fields: any, files: any) => {
      if (err) {
        console.error('Error parsing form:', err)
        return res.status(500).json({ error: 'Error parsing form data.' })
      }

      const agentId = Array.isArray(id) ? id[0] : id
      const file = files.file as formidable.File | undefined
      const url = fields.url as string | undefined

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID is required.' })
      }

      try {
        // Ensure the Qdrant collection exists
        const collectionName = `agent_${agentId}_knowledge`
        const collectionExists = await qdrantClient.getCollection(collectionName)
          .then(() => true)
          .catch(() => false)

        if (!collectionExists) {
          const created = await createCollection(collectionName)
          if (!created) {
            throw new Error('Failed to create Qdrant collection.')
          }
        }

        let entry
        let textContent: string
        let vectorId: string

        if (file) {
          // Handle file upload
          const uniqueFilename = `${uuidv4()}-${file.originalFilename}`
          const filePath = `/uploads/${uniqueFilename}`
          fs.renameSync(file.filepath, `./public${filePath}`)

          entry = {
            id: uuidv4(),
            type: 'document',
            name: file.originalFilename || 'Unnamed Document',
            filePath,
            uploadedAt: new Date().toISOString(),
            agent_id: agentId,
          }

          // Extract text from the document (implement actual extraction as needed)
          textContent = fs.readFileSync(`./public${filePath}`, 'utf-8') // Placeholder for actual text extraction
          vectorId = filePath
        } else if (url) {
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
          textContent = response.data // Placeholder for actual content extraction
          vectorId = url
        } else {
          return res.status(400).json({ error: 'No file or URL provided.' })
        }

        // Store embeddings in Qdrant
        const embeddings = await storeEmbeddings([textContent], [{ source: vectorId }], collectionName)

        // Update the agent's knowledge base in Supabase
        const supabase = createClient()
        const { data, error: updateError } = await supabase
          .from('knowledge')
          .insert([entry])

        if (updateError) {
          throw updateError
        }

        res.status(200).json({ success: true, entry })
      } catch (error) {
        console.error('Error uploading knowledge:', error)
        res.status(500).json({ error: 'Failed to upload knowledge.' })
      }
    })
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}