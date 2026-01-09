"use client"

import dynamic from "next/dynamic"
import { Assistant } from "@/types/assistant"

// Dynamically import PlaygroundContainer to reduce initial bundle size
const PlaygroundContainer = dynamic(
	() => import("@/components/playground/PlaygroundContainer").then((mod) => ({ default: mod.PlaygroundContainer })),
	{
		loading: () => (
			<div className="flex h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading playground...</div>
			</div>
		),
		ssr: false, // Playground uses client-side only features
	}
)

interface PlaygroundContainerWrapperProps {
	assistants: Assistant[]
}

export function PlaygroundContainerWrapper({ assistants }: PlaygroundContainerWrapperProps) {
	return <PlaygroundContainer assistants={assistants} />
}
