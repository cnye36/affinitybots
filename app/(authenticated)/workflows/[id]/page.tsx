import { WorkflowsBuilder } from '@/components/workflows/WorkflowsBuilder'

export default async function WorkflowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  return <WorkflowsBuilder initialWorkflowId={params.id} />
} 