import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get threads with their titles
    const { data: threads, error: threadsError } = await supabase
      .from('chat_threads')
      .select('*')
      .eq('agent_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (threadsError) throw threadsError

    // Get the last message for each thread
    const threadsWithLastMessage = await Promise.all(
      threads.map(async (thread) => {
        const { data: messages } = await supabase
          .from('agent_chats')
          .select('content')
          .eq('thread_id', thread.id)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          ...thread,
          last_message: messages?.[0]?.content
        }
      })
    )

    return NextResponse.json({ threads: threadsWithLastMessage })
  } catch (error) {
    console.error('Error in threads GET:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads' },
      { status: 500 }
    )
  }
} 