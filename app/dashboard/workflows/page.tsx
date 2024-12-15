'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle, Loader2, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'

interface Workflow {
  id: string
  name: string
  description: string
  status: 'Active' | 'Inactive' | 'Running'
  runs: number
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        const response = await axios.get('/api/workflows')
        setWorkflows(response.data.workflows)
      } catch (err: any) {
        console.error('Error fetching workflows:', err)
        setError(err.response?.data?.error || 'Failed to fetch workflows')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkflows()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Inactive':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'Running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Workflows</h1>
        <Link href="/dashboard/workflows/new">
          <Button variant="default">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {workflows.length === 0 ? (
        <p className="text-center text-muted-foreground">No workflows found. Start by creating one!</p>
      ) : (
        <div className="grid gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="p-4 border rounded-lg bg-card">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{workflow.name}</h2>
                {getStatusIcon(workflow.status)}
              </div>
              <p className="text-muted-foreground mb-2">{workflow.description}</p>
              <div className="flex justify-between text-sm">
                <span>Status: {workflow.status}</span>
                <span>Runs: {workflow.runs}</span>
              </div>
              <div className="mt-4 flex space-x-2">
                <Link href={`/dashboard/workflows/${workflow.id}`}>
                  <Button variant="outline">View</Button>
                </Link>
                <Link href={`/dashboard/workflows/${workflow.id}/edit`}>
                  <Button variant="ghost">Edit</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}