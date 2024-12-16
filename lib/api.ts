import { Node, Edge } from 'reactflow'

interface WorkflowData {
  name: string
  nodes: Node[]
  edges: Edge[]
}

export async function saveWorkflow(workflowData: WorkflowData) {
  const response = await fetch('/api/workflows', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workflowData),
  })

  if (!response.ok) {
    throw new Error('Failed to save workflow')
  }

  return await response.json()
}

