import { streamText } from 'ai'
import { createClient } from '@/utils/supabase/server'
import { initializeTools } from '@/lib/tools'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { openai } from '@ai-sdk/openai'

// Define the runtime environment
export const runtime = 'edge'
export const maxDuration = 30

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  try {
    // 1. Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get request data
    const { messages, threadId } = await req.json();
    let currentThreadId = threadId;

    // 3. Get agent details
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // 4. Create new thread if needed
    if (!currentThreadId) {
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .insert([{
          agent_id: params.id,
          user_id: user.id,
          title: messages[0]?.content?.slice(0, 100) || 'New Chat'
        }])
        .select()
        .single();

      if (threadError) throw threadError;
      currentThreadId = thread.id;
    }

    // 5. Save user message
    await supabase.from('agent_chats').insert([{
      thread_id: currentThreadId,
      agent_id: params.id,
      user_id: user.id,
      content: messages[messages.length - 1].content,
      role: 'user'
    }]);

    // 6. Initialize tools
    const { tools } = await initializeTools(agent.tools || [], agent.config?.toolsConfig);

    // 7. Generate response using AI SDK's streamText
    const result = await streamText({
      model: openai(agent.model_type || 'gpt-4o'),
      messages: [
        { role: 'system', content: agent.prompt_template },
        ...messages
      ],
      temperature: agent.config?.temperature || 0.7,
      maxTokens: agent.config?.max_tokens,
      tools: tools ? Object.entries(tools).reduce((acc, [name, tool]: [string, any]) => {
        acc[name] = {
          description: tool.description,
          parameters: tool.parameters,
          execute: async (args: any) => {
            if (tool.invoke) {
              return await tool.invoke(args);
            }
            return 'Tool execution not implemented';
          }
        };
        return acc;
      }, {} as Record<string, any>) : undefined
    });

    // Set up a callback to save the complete response
    let fullResponse = '';
    result.textStream.pipeTo(new WritableStream({
      write(chunk) {
        fullResponse += chunk;
      },
      close() {
        // Save assistant response after stream completes
        supabase.from('agent_chats').insert([{
          thread_id: currentThreadId,
          agent_id: params.id,
          user_id: user.id,
          content: fullResponse,
          role: 'assistant'
        }]).then();
      }
    }));

    // Return the streaming response
    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('Error in chat route:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get('threadId');
  const supabase = await createClient();

  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('agent_chats')
      .select('*')
      .eq('thread_id', threadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Transform messages to match useChat's expected format
    const formattedMessages = messages?.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.created_at
    })) || [];

    return NextResponse.json({ messages: formattedMessages });

  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
} 