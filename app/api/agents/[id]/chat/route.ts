import { StreamingTextResponse, LangChainStream } from 'ai'
import { createClient } from '@/utils/supabase/server'
import { ChatOpenAI } from '@langchain/openai'
import { AIMessage, HumanMessage, SystemMessage } from '@langchain/core/messages'
import { cookies } from 'next/headers'

export const runtime = 'edge'

// GET handler for loading chat messages
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
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

  // Get URL parameters
  const { searchParams } = new URL(req.url)
  const threadId = searchParams.get('threadId')

  // Get chat messages for this thread
  const query = supabase
    .from('agent_chats')
    .select('*')
    .eq('agent_id', params.id)
    .order('created_at', { ascending: true })

  if (threadId) {
    query.eq('thread_id', threadId)
  }

  const { data: messages, error: messagesError } = await query

  if (messagesError) {
    return new Response('Error fetching messages', { status: 500 })
  }

  // Format messages for the chat interface
  const formattedMessages = messages?.map(msg => ({
    id: msg.id,
    content: msg.content,
    role: msg.role,
    createdAt: msg.created_at,
    threadId: msg.thread_id
  })) || []

  return new Response(JSON.stringify({ 
    messages: formattedMessages,
    agent: {
      ...agent,
    }
  }))
}

// Helper function to generate a thread title based on the first message
async function generateThreadTitle(content: string, model: ChatOpenAI) {
  const prompt = new SystemMessage(
    'Generate a very short (3-5 words) title for a conversation that starts with this message. ' +
    'The title should capture the main topic or intent. Respond with just the title, no quotes or punctuation.'
  )
  
  try {
    const response = await model.call([
      prompt,
      new HumanMessage(content)
    ])
    return response.content.toString().trim()
  } catch (error) {
    console.error('Error generating thread title:', error)
    return 'New Conversation'
  }
}

// POST handler for chat messages
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies()
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

  // Get the messages and thread ID from the request
  const { messages, threadId: existingThreadId } = await req.json()
  const lastMessage = messages[messages.length - 1]

  // Initialize the model
  const model = new ChatOpenAI({
    modelName: agent.model_type || 'gpt-3.5-turbo',
    temperature: agent.temperature || 0.7,
    streaming: true,
  })

  let threadId = existingThreadId

  // Create new thread if needed
  if (!existingThreadId) {
    const title = await generateThreadTitle(lastMessage.content, model)
    const { data: thread, error: threadError } = await supabase
      .from('chat_threads')
      .insert({
        agent_id: params.id,
        user_id: user.id,
        title
      })
      .select()
      .single()

    if (threadError) {
      console.error('Error creating thread:', threadError)
      return new Response('Error creating thread', { status: 500 })
    }

    threadId = thread.id
  }

  // Create a new chat message
  const { data: chat, error: chatError } = await supabase
    .from('agent_chats')
    .insert({
      agent_id: params.id,
      content: lastMessage.content,
      role: 'user',
      user_id: user.id,
      thread_id: threadId
    })
    .select()
    .single()

  if (chatError) {
    console.error('Error creating chat:', chatError)
    return new Response('Error creating chat', { status: 500 })
  }

  // Get all messages for this thread for context
  const { data: threadMessages } = await supabase
    .from('agent_chats')
    .select('content, role')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  // Convert messages to LangChain format
  const systemMessage = new SystemMessage(agent.prompt_template || 'You are a helpful AI assistant.')
  const langchainMessages = [
    systemMessage,
    ...(threadMessages || []).map((m: any) => 
      m.role === 'user' 
        ? new HumanMessage(m.content)
        : new AIMessage(m.content)
    )
  ]

  let responseContent = ''

  // Create a streaming response
  const { stream, handlers } = LangChainStream({
    onToken: (token: string) => {
      responseContent += token
    },
    async onFinal() {
      // Store the complete assistant's response
      const { error: assistantMsgError } = await supabase
        .from('agent_chats')
        .insert({
          agent_id: params.id,
          content: responseContent,
          role: 'assistant',
          user_id: user.id,
          thread_id: threadId
        })

      if (assistantMsgError) {
        console.error('Error storing assistant message:', assistantMsgError)
      }
    }
  })

  // Call the model and stream the response
  model
    .call(langchainMessages, {}, [handlers])
    .catch(console.error)

  return new StreamingTextResponse(stream)
} 