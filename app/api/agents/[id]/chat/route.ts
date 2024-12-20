import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse, createStreamDataTransformer } from "ai";
import { createClient } from '@/utils/supabase/server'
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { HttpResponseOutputParser } from "langchain/output_parsers";

export const runtime = "edge";

const formatMessage = (message: VercelChatMessage) => {
  return `${message.role}: ${message.content}`;
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all chat sessions for this agent and user
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
    return NextResponse.json(
      { error: 'Failed to load chat sessions' }, 
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json();
    const messages = body.messages ?? [];
    const { chatId, name } = body;

    // If name is provided, we're creating a new chat session
    if (name) {
      const { data: newChat, error } = await supabase
        .from('agent_chats')
        .insert([{
          name,
          agent_id: params.id,
          user_id: user.id,
          messages: [],
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return NextResponse.json(newChat)
    }

    // Get agent configuration
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .single()

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Create template using agent's configuration
    const TEMPLATE = `${agent.prompt_template}

Current conversation:
{chat_history}

User: {input}
Assistant:`;

    const formattedPreviousMessages = messages.slice(0, -1).map(formatMessage);
    const currentMessageContent = messages[messages.length - 1].content;
    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new ChatOpenAI({
      modelName: agent.model_type,
      temperature: agent.config?.temperature ?? 0.7,
      streaming: true,
    });

    const outputParser = new HttpResponseOutputParser();
    const chain = prompt.pipe(model).pipe(outputParser);

    // Store the message in Supabase if chatId is provided
    if (chatId) {
      const { error: updateError } = await supabase
        .from('agent_chats')
        .update({ messages })
        .eq('id', chatId)
        .eq('user_id', user.id) // Ensure user owns this chat

      if (updateError) throw updateError
    }

    const stream = await chain.stream({
      chat_history: formattedPreviousMessages.join("\n"),
      input: currentMessageContent,
    });

    return new StreamingTextResponse(
      stream.pipeThrough(createStreamDataTransformer())
    );
  } catch (e: any) {
    console.error('Error in chat:', e);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}