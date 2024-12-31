import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (agentsError) {
      throw agentsError
    }

    // Get tools for each agent
    const agentsWithTools = await Promise.all(
      agents.map(async (agent) => {
        const { data: tools } = await supabase
          .from('workflow_agents')
          .select('*')
          .eq('agent_id', agent.id)
        
        return {
          ...agent,
          tools: tools || []
        }
      })
    )

    return NextResponse.json({ agents: agentsWithTools })
  } catch (error) {
    console.error('Error in GET /api/agents:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    const {
      name,
      description,
      model_type,
      prompt_template,
      tools,
      agent_type,
      config = {}
    } = json

    const { data, error } = await supabase
      .from('agents')
      .insert([{
        name,
        description,
        model_type,
        prompt_template,
        tools,
        agent_type,
        config,
        owner_id: user.id
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating agent:', error)
    return NextResponse.json(
      { error: 'Error creating agent' },
      { status: 500 }
    )
  }
}