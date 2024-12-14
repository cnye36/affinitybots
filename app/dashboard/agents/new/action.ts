'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createAgent(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const prompt = formData.get('prompt') as string
    const agentType = formData.get('agentType') as string
    const modelType = formData.get('modelType') as string
    const tools = JSON.parse(formData.get('tools') as string)

    const { error } = await supabase.from('agents').insert([{
      name: `AI Agent - ${prompt.slice(0, 30)}...`,
      description: prompt,
      model_type: modelType,
      prompt_template: prompt,
      config: {},
      tools,
      owner_id: user.id,
      agent_type: agentType
    }])

    if (error) throw error

    revalidatePath('/dashboard/agents')
    return { success: true }
  } catch (error) {
    console.error('Error creating agent:', error)
    return { error: 'Failed to create agent' }
  }
} 