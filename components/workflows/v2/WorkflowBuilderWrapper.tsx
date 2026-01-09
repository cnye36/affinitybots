"use client"

import dynamic from "next/dynamic"

// Dynamically import WorkflowBuilder to reduce initial bundle size
// This component is large (1442 lines) and only needed on this route
const WorkflowBuilder = dynamic(
	() => import("@/components/workflows/v2/WorkflowBuilder").then((mod) => ({ default: mod.WorkflowBuilder })),
	{
		loading: () => (
			<div className="flex h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading workflow builder...</div>
			</div>
		),
		ssr: false, // WorkflowBuilder uses client-side only features
	}
)

export function WorkflowBuilderWrapper() {
	return <WorkflowBuilder />
}
