'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteAgent(agentId: string) {
  try {
    const supabase = await createClient()
    
    // First, delete associated agent chats
    const { error: chatsError } = await supabase
      .from('agent_chats')
      .delete()
      .eq('agent_id', agentId)

    if (chatsError) throw chatsError

    // Then, delete associated chat threads
    const { error: threadsError } = await supabase
      .from('chat_threads')
      .delete()
      .eq('agent_id', agentId)

    if (threadsError) throw threadsError

    // Delete from workflow_agents if it exists
    const { error: workflowAgentsError } = await supabase
      .from('workflow_agents')
      .delete()
      .eq('agent_id', agentId)

    if (workflowAgentsError) throw workflowAgentsError

    // Finally, delete the agent
    const { error: agentError } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId)

    if (agentError) throw agentError

    revalidatePath('/agents')
    return { success: true }
  } catch (error) {
    console.error('Error deleting agent:', error)
    return { error: error instanceof Error ? error.message : 'Failed to delete agent' }
  }
}