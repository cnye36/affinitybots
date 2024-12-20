import { StreamingTextResponse, LangChainStream } from 'ai'
import { createClient } from '@/utils/supabase/server'
import { ChatOpenAI } from '@langchain/openai'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { cookies } from 'next/headers'

export const runtime = 'edge'

// GET handler for loading chat sessions
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get the agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (agentError || !agent) {
    return new Response('Agent not found', { status: 404 })
  }

  // Get chat messages for this agent
  const { data: messages, error: messagesError } = await supabase
    .from('agent_chats')
    .select('*')
    .eq('agent_id', params.id)
    .order('created_at', { ascending: true })

  if (messagesError) {
    return new Response('Error fetching messages', { status: 500 })
  }

  // Format messages for the chat interface
  const formattedMessages = messages?.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.role,
    createdAt: msg.created_at
  })) || []

  return new Response(JSON.stringify({ 
    messages: formattedMessages,
    agent: {
      ...agent,
    }
  }))
}

// POST handler for chat messages
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const cookieStore = cookies()
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Get the agent
  const { data: agent, error: agentError } = await supabase
    .from('agents')
    .select('*')
    .eq('id', params.id)
    .eq('owner_id', user.id)
    .single()

  if (agentError || !agent) {
    return new Response('Agent not found', { status: 404 })
  }

  // Get the messages from the request
  const { messages } = await req.json()
  const lastMessage = messages[messages.length - 1]

  // Generate a name for the chat message based on timestamp
  const timestamp = new Date().toISOString()
  const chatName = `Chat with ${agent.name} at ${timestamp}`

  // Create a new chat message
  const { data: chat, error: chatError } = await supabase
    .from('agent_chats')
    .insert({
      agent_id: params.id,
      content: lastMessage.content,
      role: 'user',
      user_id: user.id,
      name: chatName // Add the required name field
    })
    .select()
    .single()

  if (chatError) {
    console.error('Error creating chat:', chatError)
    return new Response('Error creating chat', { status: 500 })
  }

  // Convert messages to LangChain format
  const systemMessage = new SystemMessage(agent.prompt_template || 'You are a helpful AI assistant.')
  const langchainMessages = [
    systemMessage,
    ...messages.map((m: any) => 
      m.role === 'user' 
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    )
  ]

  // Create a streaming response
  const { stream, handlers } = LangChainStream({
    async onCompletion(completion) {
      // Store the assistant's response
      const { error: assistantMsgError } = await supabase
        .from('agent_chats')
        .insert({
          agent_id: params.id,
          content: completion,
          role: 'assistant',
          user_id: user.id,
          name: chatName // Use the same chat name for the response
        })

      if (assistantMsgError) {
        console.error('Error storing assistant message:', assistantMsgError)
      }
    },
  })

  // Initialize the model with the agent's configuration
  const model = new ChatOpenAI({
    modelName: agent.model_type || 'gpt-3.5-turbo',
    streaming: true,
    temperature: agent.temperature || 0.7,
  })

  // Call the model and stream the response
  model
    .call(langchainMessages, {}, [handlers])
    .catch(console.error)

  return new StreamingTextResponse(stream)
} 