"use client"

import React from "react"
import { TutorialLayout } from "@/components/tutorial/TutorialLayout"
import { dashboardTutorial } from "@/lib/tutorials"

interface DashboardWithTutorialProps {
	children: React.ReactNode
	userCreatedAt?: string | null
}

/**
 * Dashboard wrapper with tutorial functionality
 */
export function DashboardWithTutorial({ children, userCreatedAt = null }: DashboardWithTutorialProps) {
	return (
		<TutorialLayout tutorials={[dashboardTutorial]} userCreatedAt={userCreatedAt}>
			{children}
		</TutorialLayout>
	)
}
