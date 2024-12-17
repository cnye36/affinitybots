'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function deleteAgent(id: string) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .single()

    if (error) throw error
    
    revalidatePath('/dashboard/agents')
  } catch (error) {
    console.error('Error deleting agent:', error)
  }
} 