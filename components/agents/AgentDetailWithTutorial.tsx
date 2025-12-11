"use client"

import React from "react"
import { TutorialLayout } from "@/components/tutorial/TutorialLayout"
import { agentDetailTutorial } from "@/lib/tutorials"

interface AgentDetailWithTutorialProps {
	children: React.ReactNode
}

/**
 * Agent detail page wrapper with tutorial functionality
 */
export function AgentDetailWithTutorial({ children }: AgentDetailWithTutorialProps) {
	return (
		<TutorialLayout tutorials={[agentDetailTutorial]}>
			{children}
		</TutorialLayout>
	)
}
