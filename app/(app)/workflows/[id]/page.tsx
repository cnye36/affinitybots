import { redirect } from 'next/navigation'

export default async function WorkflowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  redirect(`/workflows/builder?id=${params.id}`)
} 