'use server'

import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { generateAgentConfiguration } from '@/lib/agent-generation'

export async function createAgent(formData: FormData) {
  const supabase = createServerActionClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const prompt = formData.get('prompt') as string
    const agentType = formData.get('agentType') as string
    const useTemplate = formData.get('useTemplate') === 'true'

    // Generate AI-powered configuration
    const agentConfig = await generateAgentConfiguration(prompt, agentType)

    const { error } = await supabase.from('agents').insert([{
      name: agentConfig.name,
      description: agentConfig.description,
      model_type: agentConfig.model_type,
      prompt_template: agentConfig.prompt_template,
      config: agentConfig.config,
      tools: agentConfig.tools,
      owner_id: user.id,
      agent_type: agentType
    }])

    if (error) throw error

    revalidatePath('/agents')
    return { success: true }
  } catch (error) {
    console.error('Error creating agent:', error)
    return { error: 'Failed to create agent' }
  }
} 