"use client"

import dynamic from "next/dynamic"
import { ReactNode } from "react"

// Try SimpleErrorBoundary first to avoid webpack module loading issues
// If this works, the issue is with ErrorBoundary's dependencies (Alert, Button components)
const ErrorBoundary = dynamic(
	() => import("@/components/SimpleErrorBoundary").then((mod) => ({ default: mod.SimpleErrorBoundary })),
	{
		ssr: true, // ErrorBoundary needs to work on both server and client
	}
)

interface ErrorBoundaryWrapperProps {
	children: ReactNode
	fallback?: ReactNode
}

export function ErrorBoundaryWrapper({ children, fallback }: ErrorBoundaryWrapperProps) {
	return (
		<ErrorBoundary fallback={fallback}>
			{children}
		</ErrorBoundary>
	)
}
