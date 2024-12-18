import { NextResponse } from 'next/server'
import supabaseServerClient from '@/lib/supabaseServerClient'

export async function GET(request: Request) {
  try {
    const { data: { session }, error: sessionError } = await supabaseServerClient.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: agents, error } = await supabaseServerClient
      .from('agents')
      .select('*')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching agents:', error)
      return NextResponse.json({ error: 'Error fetching agents' }, { status: 500 })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { data: { session }, error: sessionError } = await supabaseServerClient.auth.getSession()
    if (sessionError || !session) {
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

    const { data, error } = await supabaseServerClient
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