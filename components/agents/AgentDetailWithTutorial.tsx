"use client"

import React from "react"
import { TutorialLayout } from "@/components/tutorial/TutorialLayout"
import { agentDetailTutorial } from "@/lib/tutorials"

interface AgentDetailWithTutorialProps {
	children: React.ReactNode
	userCreatedAt?: string | null
}

/**
 * Agent detail page wrapper with tutorial functionality
 */
export function AgentDetailWithTutorial({ children, userCreatedAt = null }: AgentDetailWithTutorialProps) {
	return (
		<TutorialLayout tutorials={[agentDetailTutorial]} userCreatedAt={userCreatedAt}>
			{children}
		</TutorialLayout>
	)
}
