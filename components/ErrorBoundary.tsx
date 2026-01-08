"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface Props {
	children: ReactNode
	fallback?: ReactNode
}

interface State {
	hasError: boolean
	error: Error | null
	errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		}
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		}
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo)
		this.setState({
			error,
			errorInfo,
		})

		// Log to error reporting service if available
		if (typeof window !== "undefined" && (window as any).Sentry) {
			;(window as any).Sentry.captureException(error, {
				contexts: {
					react: {
						componentStack: errorInfo.componentStack,
					},
				},
			})
		}
	}

	handleReset = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		})
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<div className="flex items-center justify-center min-h-screen p-4">
					<Alert variant="destructive" className="max-w-2xl">
						<AlertTriangle className="h-4 w-4" />
						<AlertTitle>Something went wrong</AlertTitle>
						<AlertDescription className="mt-4 space-y-4">
							<p>
								An unexpected error occurred. This has been logged and we&apos;ll look into it.
							</p>
							{process.env.NODE_ENV === "development" && this.state.error && (
								<div className="mt-4">
									<p className="text-sm font-mono text-red-600 dark:text-red-400 break-words">
										{this.state.error.toString()}
									</p>
									{this.state.errorInfo && (
										<details className="mt-2">
											<summary className="text-sm cursor-pointer text-muted-foreground">
												Component Stack
											</summary>
											<pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-40">
												{this.state.errorInfo.componentStack}
											</pre>
										</details>
									)}
								</div>
							)}
							<div className="flex gap-2 mt-4">
								<Button onClick={this.handleReset} variant="outline" size="sm">
									<RefreshCw className="h-4 w-4 mr-2" />
									Try Again
								</Button>
								<Button
									onClick={() => window.location.reload()}
									variant="default"
									size="sm"
								>
									Reload Page
								</Button>
							</div>
						</AlertDescription>
					</Alert>
				</div>
			)
		}

		return this.props.children
	}
}
