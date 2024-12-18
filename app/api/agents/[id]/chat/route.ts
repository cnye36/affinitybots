import OpenAI from 'openai'
import { streamText } from 'ai'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { data: chats, error } = await supabase
      .from('agent_chats')
      .select('*')
      .eq('agent_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(chats)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { messages, chatId, name } = body

    // If no chatId, create new chat session
    if (!chatId) {
      const { data: chat, error } = await supabase
        .from('agent_chats')
        .insert([{
          agent_id: params.id,
          user_id: user.id,
          name: name || `Chat ${Date.now()}`,
          thread_id: crypto.randomUUID(),
          messages: []
        }])
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json(chat)
    }

    // Get agent configuration
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .single()

    // Create OpenAI streaming response
    const response = await openai.chat.completions.create({
      model: agent.model_type,
      messages: [
        { role: 'system', content: agent.prompt_template },
        ...messages
      ],
      stream: true,
    })

    // Store the message in the database
    await supabase.from('agent_chats')
      .update({
        messages: messages
      })
      .eq('id', chatId)

    // Return streaming response
    return streamText({
      model: agent.model_type,
      messages: [
        { role: 'system', content: agent.prompt_template },
        ...messages
      ],
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}