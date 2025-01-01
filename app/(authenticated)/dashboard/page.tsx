import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlusCircle, Settings2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SidebarInset } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export default async function Dashboard() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError) {
    console.error('Error fetching user:', userError)
  }

  if (!user) {
    redirect('/signin')
  }

  // Fetch latest agents
  const { data: latestAgents, error: agentsError } = await supabase
    .from('agents')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  if (agentsError) {
    console.error('Error fetching agents:', agentsError)
  }

  // Fetch latest workflows
  const { data: latestWorkflows, error: workflowsError } = await supabase
    .from('workflows')
    .select('id, name, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  if (workflowsError) {
    console.error('Error fetching workflows:', workflowsError)
  }

  return (
    <SidebarInset>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold mb-4">Welcome to your AI Workspace</h1>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Link href="/agents/new" className="group">
              <div className={cn(
                "relative p-6 rounded-lg overflow-hidden border transition-colors",
                "hover:border-transparent hover:gradient-border"
              )}>
                <div className="flex items-center space-x-4">
                  <PlusCircle className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Create New Agent</h3>
                    <p className="text-sm text-muted-foreground">Design a custom AI agent with specific capabilities</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/workflows/new" className="group">
              <div className={cn(
                "relative p-6 rounded-lg overflow-hidden border transition-colors",
                "hover:border-transparent hover:gradient-border"
              )}>
                <div className="flex items-center space-x-4">
                  <PlusCircle className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold mb-1">New Workflow</h3>
                    <p className="text-sm text-muted-foreground">Build a multi-agent workflow from scratch</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/settings" className="group">
              <div className={cn(
                "relative p-6 rounded-lg overflow-hidden border transition-colors",
                "hover:border-transparent hover:gradient-border"
              )}>
                <div className="flex items-center space-x-4">
                  <Settings2 className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Settings</h3>
                    <p className="text-sm text-muted-foreground">Configure your workspace and preferences</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Latest Agents */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Latest Agents</h3>
              <Link href="/agents">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agentsError ? (
                <div className="col-span-full border border-destructive rounded-lg p-4">
                  <p className="text-destructive text-center">Error loading agents: {agentsError.message}</p>
                </div>
              ) : !latestAgents ? (
                // Loading state
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))
              ) : latestAgents.length > 0 ? (
                latestAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className={cn(
                      "relative p-6 rounded-lg overflow-hidden border transition-colors",
                      "hover:border-transparent hover:gradient-border"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{agent.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {agent.description || 'No description provided'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Link href={`/agents/${agent.id}`}>
                                <Button variant="ghost" size="icon">
                                  <Settings2 className="h-4 w-4" />
                                </Button>
                              </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Agent</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
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
                  <Link href="/agents/new">
                    <Button>
                      <PlusCircle className="mr-2" />
                      Create Agent
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Latest Workflows */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Latest Workflows</h3>
              <Link href="/workflows">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workflowsError ? (
                <div className="col-span-full border border-destructive rounded-lg p-4">
                  <p className="text-destructive text-center">Error loading workflows: {workflowsError.message}</p>
                </div>
              ) : !latestWorkflows ? (
                // Loading state
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))
              ) : latestWorkflows.length > 0 ? (
                latestWorkflows.map((workflow) => (
                  <Link href={`/workflows/${workflow.id}`} key={workflow.id}>
                    <div className={cn(
                      "relative p-6 rounded-lg overflow-hidden border transition-colors",
                      "hover:border-transparent hover:gradient-border"
                    )}>
                      <h2 className="text-xl font-semibold mb-2">{workflow.name}</h2>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Created on: {new Date(workflow.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last updated: {new Date(workflow.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full border rounded-lg p-8 text-center">
                  <h3 className="text-lg font-semibold mb-2">No workflows yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first workflow to get started
                  </p>
                  <Link href="/workflows/new">
                    <Button>
                      <PlusCircle className="mr-2" />
                      Create Workflow
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  )
}