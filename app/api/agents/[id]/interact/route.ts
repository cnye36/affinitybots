import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { RequestCookies } from '@edge-runtime/cookies';
import { initializeLangChain, validateAgentConfig, AgentInitializationError } from '@/lib/langchain';
import { LangChainAdapter } from 'ai';

export const runtime = 'edge';

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
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
    const lastMessage = body.messages?.at(-1)?.content;

    if (!lastMessage || typeof lastMessage !== 'string') {
      return NextResponse.json({ error: 'Message must be a non-empty string' }, { status: 400 });
    }

    // Fetch and validate agent
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json({ error: 'Agent not found or access denied' }, { status: 404 });
    }

    validateAgentConfig(agent);
    const chain = initializeLangChain(agent);
    const response = await chain.call({ message: lastMessage });

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Error interacting with agent:', error);
    if (error instanceof AgentInitializationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
