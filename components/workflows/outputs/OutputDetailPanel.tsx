"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import ReactMarkdown from "react-markdown"
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface OutputDetailPanelProps {
	workflowId: string,
	outputNodeId: string,
	onClose: () => void,
}

interface WorkflowRun {
	run_id: string,
	status: "pending" | "running" | "completed" | "failed",
	started_at: string,
	completed_at?: string,
	result?: any,
	error?: string,
}

export function OutputDetailPanel({
	workflowId,
	outputNodeId,
	onClose,
}: OutputDetailPanelProps) {
	const [latestRun, setLatestRun] = useState<WorkflowRun | null>(null)
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)

	const fetchLatestRun = async () => {
		try {
			const response = await fetch(`/api/workflows/${workflowId}/executions?limit=1`)
			if (!response.ok) {
				throw new Error("Failed to fetch executions")
			}
			const data = await response.json()
			setLatestRun(data.runs?.[0] || null)
		} catch (error) {
			console.error("Error fetching latest run:", error)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	useEffect(() => {
		fetchLatestRun()
	}, [workflowId])

	const handleRefresh = async () => {
		setRefreshing(true)
		await fetchLatestRun()
	}

	if (loading) {
		return (
			<Card className="max-w-3xl">
				<CardContent className="flex items-center justify-center p-8">
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		)
	}

	if (!latestRun) {
		return (
			<Card className="max-w-3xl">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<CardTitle className="text-lg font-semibold">Workflow Result</CardTitle>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-8 w-8"
					>
						<X className="h-4 w-4" />
					</Button>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center p-12 text-center">
						<div className="rounded-full bg-muted p-4 mb-4">
							<AlertCircle className="h-12 w-12 text-muted-foreground" />
						</div>
						<h3 className="text-lg font-medium mb-2">No Executions Yet</h3>
						<p className="text-sm text-muted-foreground max-w-md">
							This workflow hasn't been executed yet. Run the workflow to see output here.
						</p>
					</div>
				</CardContent>
			</Card>
		)
	}

	const { result, status, error, started_at } = latestRun

	return (
		<Card className="max-w-4xl">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
				<div className="flex-1">
					<CardTitle className="text-lg font-semibold mb-1">
						Workflow Result
					</CardTitle>
					<p className="text-sm text-muted-foreground">
						Latest execution: {new Date(started_at).toLocaleString()}
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleRefresh}
						disabled={refreshing}
						className="h-8 w-8"
					>
						<RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="h-8 w-8"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>

			<CardContent className="space-y-4">
				{/* Status Banner */}
				<div
					className={cn(
						"flex items-center gap-2 p-3 rounded-lg border",
						status === "completed" && "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
						status === "failed" && "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
						status === "running" && "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
						status === "pending" && "bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:border-gray-800",
					)}
				>
					{status === "completed" && (
						<>
							<CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
							<span className="font-medium text-emerald-700 dark:text-emerald-300">
								Completed Successfully
							</span>
						</>
					)}
					{status === "failed" && (
						<>
							<AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
							<span className="font-medium text-red-700 dark:text-red-300">
								Execution Failed
							</span>
						</>
					)}
					{status === "running" && (
						<>
							<Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
							<span className="font-medium text-blue-700 dark:text-blue-300">
								Running...
							</span>
						</>
					)}
					{status === "pending" && (
						<>
							<Loader2 className="h-5 w-5 text-gray-600 dark:text-gray-400" />
							<span className="font-medium text-gray-700 dark:text-gray-300">
								Pending
							</span>
						</>
					)}
				</div>

				{/* Error Display */}
				{error && (
					<div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
						<p className="text-sm font-medium text-red-800 dark:text-red-300 mb-1">
							Error:
						</p>
						<p className="text-sm text-red-700 dark:text-red-400 font-mono">
							{error}
						</p>
					</div>
				)}

				{/* Result Display */}
				{result && (
					<Tabs defaultValue="formatted" className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="formatted">Formatted</TabsTrigger>
							<TabsTrigger value="raw">Raw</TabsTrigger>
							<TabsTrigger value="json">JSON</TabsTrigger>
						</TabsList>

						<TabsContent value="formatted" className="mt-4">
							<div className="prose prose-sm dark:prose-invert max-w-none">
								{typeof result === "string" ? (
									<ReactMarkdown
										components={{
											// Custom component styling for markdown
											p: ({ node, ...props }) => (
												<p className="mb-3 last:mb-0" {...props} />
											),
											code: ({ node, ...props }) => (
												<code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
											),
											pre: ({ node, ...props }) => (
												<pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props} />
											),
										}}
									>
										{result}
									</ReactMarkdown>
								) : (
									<pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
										{JSON.stringify(result, null, 2)}
									</pre>
								)}
							</div>
						</TabsContent>

						<TabsContent value="raw" className="mt-4">
							<div className="bg-muted p-4 rounded-lg font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap break-words">
								{typeof result === "string" ? result : JSON.stringify(result)}
							</div>
						</TabsContent>

						<TabsContent value="json" className="mt-4">
							<pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
								{JSON.stringify(result, null, 2)}
							</pre>
						</TabsContent>
					</Tabs>
				)}

				{/* No Result */}
				{!result && !error && status === "completed" && (
					<div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
						<p className="text-sm">No output was generated by this workflow execution.</p>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
