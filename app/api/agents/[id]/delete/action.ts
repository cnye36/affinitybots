'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function deleteAgent(id: string) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    console.log(`Attempting to delete agent with ID: ${id}`)
    
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error deleting agent:', error)
      throw error
    }
    
    console.log(`Successfully deleted agent with ID: ${id}`)
    revalidatePath('/agents')
  } catch (error) {
    console.error('Unexpected error in deleteAgent:', error)
  }
}