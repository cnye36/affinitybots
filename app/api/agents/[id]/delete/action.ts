'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAgent(agentId: string) {
  const supabase = await createClient()
  
  // First delete all chat threads (this will cascade to agent_chats)
  const { error: threadError } = await supabase
    .from('chat_threads')
    .delete()
    .eq('agent_id', agentId)

  if (threadError) {
    console.error('Error deleting chat threads:', threadError)
    return { error: 'Failed to delete chat threads' }
  }

  // Then delete the agent
  const { error: agentError } = await supabase
    .from('agents')
    .delete()
    .eq('id', agentId)

  if (agentError) {
    console.error('Error deleting agent:', agentError)
    return { error: 'Failed to delete agent' }
  }

  return { success: true }
}