export interface WorkflowNode {
    id: string
    type: string
    position: { x: number; y: number }
    data: {
      label: string
      [key: string]: any
    }
  }
  
  export interface WorkflowEdge {
    id: string
    source: string
    target: string
    type: string
    label?: string
  }
  
  export interface Workflow {
    id: string
    name: string
    description?: string
    owner_id: string
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    created_at?: string
    updated_at?: string
    status?: 'Active' | 'Inactive' | 'Running'
    runs?: number
  }