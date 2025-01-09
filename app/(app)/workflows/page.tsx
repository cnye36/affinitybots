import { Button } from '@/components/ui/button'
import Link from 'next/link'
import React from 'react'
import { createClient } from '@/utils/supabase/server'

interface Workflow {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export default async function WorkflowsPage() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const pageSize = 10
  const currentPage = 1

  if (userError || !user) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Workflows</h1>
        <div className="text-red-500">Error fetching user: {userError?.message}</div>
      </div>
    )
  }

  const { data: workflows, error } = await supabase
    .from('workflows')
    .select('id, name, created_at, updated_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1)

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-4">My Workflows</h1>
        <div className="text-red-500">Error fetching workflows: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Workflows</h1>
        <Link href="/workflows/new">
          <Button>Create New Workflow</Button>
        </Link>
      </div>

      {workflows && workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow: Workflow) => (
            <Link href={`/workflows/${workflow.id}`} key={workflow.id}>
              <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
                <h2 className="text-xl font-semibold mb-2">{workflow.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Created on:{" "}
                  {new Date(workflow.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Last updated:{" "}
                  {new Date(workflow.updated_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <p>
            No workflows found. Click &quot;Create New Workflow&quot; to get
            started.
          </p>
        </div>
      )}
    </div>
  );
}