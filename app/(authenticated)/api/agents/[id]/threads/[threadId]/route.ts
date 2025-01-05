import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

// PATCH - Rename thread
export async function PATCH(req: Request, props: { params: Promise<{ id: string; threadId: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { title } = await req.json()

  // Update thread title
  const { error } = await supabase
    .from('chat_threads')
    .update({ title })
    .eq('id', params.threadId)
    .eq('agent_id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return new Response('Error updating thread', { status: 500 })
  }

  return new Response('OK')
}

// DELETE - Delete thread and its messages
export async function DELETE(req: Request, props: { params: Promise<{ id: string; threadId: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Delete thread messages first
  await supabase
    .from('agent_chats')
    .delete()
    .eq('thread_id', params.threadId)
    .eq('agent_id', params.id)
    .eq('user_id', user.id)

  // Delete thread
  const { error } = await supabase
    .from('chat_threads')
    .delete()
    .eq('id', params.threadId)
    .eq('agent_id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return new Response('Error deleting thread', { status: 500 })
  }

  return new Response('OK')
} 