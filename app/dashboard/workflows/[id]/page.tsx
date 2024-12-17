import { WorkflowsBuilder } from '@/components/workflows/WorkflowsBuilder'

export default function WorkflowPage({ params }: { params: { id: string } }) {
  return <WorkflowsBuilder initialWorkflowId={params.id} />
} 