import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('GET /api/agents - Start')
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    console.log('Checking session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json({ error: 'Session error' }, { status: 401 })
    }
    
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session found, fetching agents...')
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, description, agent_type')
      .eq('owner_id', session.user.id)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`Found ${agents?.length || 0} agents`)
    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Error fetching agents' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
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
        owner_id: session.user.id
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