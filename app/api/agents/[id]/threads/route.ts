import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get threads for this agent
  const { data: threads, error: threadsError } = await supabase
    .from('chat_threads')
    .select(`
      id,
      title,
      created_at,
      updated_at,
      agent_chats!inner (
        content,
        created_at
      )
    `)
    .eq('agent_id', params.id)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (threadsError) {
    return new Response('Error fetching threads', { status: 500 })
  }

  // Format threads with their latest message
  const formattedThreads = threads?.map(thread => {
    const latestMessage = thread.agent_chats.sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0]

    return {
      id: thread.id,
      name: thread.title,
      created_at: thread.created_at,
      updated_at: thread.updated_at,
      last_message: latestMessage?.content || null
    }
  }) || []

  return new Response(JSON.stringify({ threads: formattedThreads }))
} 