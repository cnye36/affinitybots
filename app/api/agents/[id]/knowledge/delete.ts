import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { client as qdrantClient } from '@/lib/qdrant'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const supabase = await createClient()

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entryId = searchParams.get('entryId')
    const type = searchParams.get('type') as 'document' | 'url'

    if (!entryId || !type) {
      return NextResponse.json({ error: 'Entry ID and type are required.' }, { status: 400 })
    }

    // Fetch the entry to get the filePath or URL
    const { data: entry, error: fetchError } = await supabase
      .from(type === 'document' ? 'documents' : 'urls')
      .select('*')
      .eq('id', entryId)
      .eq('agent_id', id)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Entry not found.' }, { status: 404 })
    }

    // Delete the entry from Supabase
    const { error: deleteError } = await supabase
      .from(type === 'document' ? 'documents' : 'urls')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      throw deleteError
    }

    // Remove embeddings from Qdrant
    const collectionName = `agent_${id}_knowledge`
    const vectorId = entry.filePath || entry.url

    if (vectorId) {
      await qdrantClient.delete(collectionName, {
        points: [vectorId],
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting knowledge entry:', error)
    return NextResponse.json({ error: 'Failed to delete knowledge entry.' }, { status: 500 })
  }
}