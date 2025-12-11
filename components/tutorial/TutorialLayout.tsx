"use client"

import React from "react"
import { TutorialProvider } from "@/contexts/TutorialContext"
import { Tutorial as TutorialUI } from "./Tutorial"
import { Tutorial } from "@/types/tutorial"

interface TutorialLayoutProps {
	children: React.ReactNode
	tutorials?: Tutorial[]
}

/**
 * TutorialLayout Component
 * Wraps page content with tutorial functionality
 */
export function TutorialLayout({ children, tutorials = [] }: TutorialLayoutProps) {
	return (
		<TutorialProvider tutorials={tutorials}>
			{children}
			<TutorialUI />
		</TutorialProvider>
	)
}
