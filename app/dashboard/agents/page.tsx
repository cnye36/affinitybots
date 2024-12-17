import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, Settings2, Trash2, MessageSquare } from 'lucide-react'
import { deleteAgent } from './[id]/delete/action'

export default async function AgentsPage() {
  const supabase = createServerComponentClient({
    cookies: () => cookies()
  })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/signin')
  }

  const { data: agents, error } = await supabase
    .from('agents')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <Link href="/dashboard/agents/new">
          <Button>
            <PlusCircle className="mr-2" />
            Create Agent
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive p-4 mb-8">
          <p className="text-destructive">Error loading agents. Please try again later.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents && agents.length > 0 ? (
          agents.map((agent) => (
            <div
              key={agent.id}
              className="border rounded-lg p-6 hover:border-primary transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {agent.description || 'No description provided'}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Link href={`/dashboard/agents/${agent.id}/interact`}>
                    <Button variant="ghost" size="icon">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/agents/${agent.id}/edit`}>
                    <Button variant="ghost" size="icon">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </Link>
                  <form action={deleteAgent.bind(null, agent.id)}>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <span className="flex items-center">
                  Model: {agent.model_type}
                </span>
                <span className="mx-2">•</span>
                <span>
                  {agent.tools?.length || 0} tools
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full border rounded-lg p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI agent to get started
            </p>
            <Link href="/dashboard/agents/new">
              <Button>
                <PlusCircle className="mr-2" />
                Create Agent
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 