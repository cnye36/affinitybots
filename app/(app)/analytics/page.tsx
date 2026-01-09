"use client"

import dynamic from "next/dynamic"

// Dynamically import AnalyticsDashboard to reduce initial bundle size
const AnalyticsDashboard = dynamic(
	() => import("@/components/analytics/AnalyticsDashboard").then((mod) => ({ default: mod.AnalyticsDashboard })),
	{
		loading: () => (
			<div className="flex h-screen items-center justify-center">
				<div className="text-muted-foreground">Loading analytics...</div>
			</div>
		),
		ssr: false, // Analytics uses client-side only features
	}
)

export default function AnalyticsPage() {
	return <AnalyticsDashboard />
}
