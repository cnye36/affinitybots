import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'

export default function WorkflowsPage() {
  // Placeholder data, replace with actual data fetching logic
  const workflows = [
    {
      id: '1',
      name: 'Content Pipeline',
      description: 'Automates content creation and distribution.',
      status: 'Active',
      runs: 10,
    },
    {
      id: '2',
      name: 'Data Analysis',
      description: 'Processes and analyzes data streams.',
      status: 'Inactive',
      runs: 5,
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Workflows</h1>
        <Link href="/dashboard/workflows/new">
          <Button variant="default">
            <PlusCircle className="mr-2 h-5 w-5" />
            Create Workflow
          </Button>
        </Link>
      </div>
      <div className="grid gap-6">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="p-4 border rounded-lg bg-card">
            <h2 className="text-xl font-semibold">{workflow.name}</h2>
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
        {workflows.length === 0 && (
          <p className="text-center text-muted-foreground">No workflows found. Start by creating one!</p>
        )}
      </div>
    </div>
  )
}