"use client"

import React from "react"
import { TutorialLayout } from "@/components/tutorial/TutorialLayout"
import { dashboardTutorial } from "@/lib/tutorials"

interface DashboardWithTutorialProps {
	children: React.ReactNode
}

/**
 * Dashboard wrapper with tutorial functionality
 */
export function DashboardWithTutorial({ children }: DashboardWithTutorialProps) {
	return (
		<TutorialLayout tutorials={[dashboardTutorial]}>
			{children}
		</TutorialLayout>
	)
}
