import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { RequestCookies } from '@edge-runtime/cookies';
import { initializeLangChain, validateAgentConfig, AgentInitializationError } from '@/lib/langchain';
import { LangChainAdapter } from 'ai';

export const runtime = 'edge';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const cookies = new RequestCookies(request.headers);
  const supabase = createRouteHandlerClient({ cookies: () => cookies });

  try {
    // Authenticate user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    console.log('Received request body:', body);
    
    // Get the last user message from the messages array
    const lastMessage = body.messages?.[body.messages.length - 1];
    if (!lastMessage?.content || typeof lastMessage.content !== 'string') {
      console.log('Invalid message:', lastMessage);
      return NextResponse.json({ error: 'Message must be a non-empty string' }, { status: 400 });
    }

    // Fetch agent configuration
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json(
        { error: 'Agent not found or access denied' },
        { status: 404 }
      );
    }

    // Validate agent configuration
    try {
      validateAgentConfig(agent);
    } catch (error) {
      if (error instanceof AgentInitializationError) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      throw error;
    }

    // Initialize LangChain with agent configuration
    const chain = initializeLangChain(agent);

    // Call the chain to get the response
    const response = await chain.call({ message: lastMessage.content });

    // Return the response as JSON
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error interacting with agent:', error);
    if (error instanceof AgentInitializationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
