'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { generateAgentConfiguration } from '@/lib/agent-generation'

export async function createAgent(formData: FormData) {
  const supabase = await createClient()
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const prompt = formData.get('prompt') as string
    const agentType = formData.get("agentType") as string;

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