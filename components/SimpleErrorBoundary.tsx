"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
	children: ReactNode
	fallback?: ReactNode
}

interface State {
	hasError: boolean
	error: Error | null
}

export class SimpleErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props)
		this.state = {
			hasError: false,
			error: null,
		}
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
		}
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo)
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback
			}

			return (
				<div className="flex items-center justify-center min-h-screen p-4">
					<div className="max-w-2xl p-4 border border-red-500 rounded-lg bg-red-50 dark:bg-red-900/20">
						<h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
							Something went wrong
						</h2>
						<p className="text-sm text-red-600 dark:text-red-300 mb-4">
							An unexpected error occurred. Please try refreshing the page.
						</p>
						{process.env.NODE_ENV === "development" && this.state.error && (
							<details className="mt-4">
								<summary className="text-sm cursor-pointer text-red-700 dark:text-red-300">
									Error details
								</summary>
								<pre className="text-xs mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto max-h-40">
									{this.state.error.toString()}
								</pre>
							</details>
						)}
						<button
							onClick={() => window.location.reload()}
							className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
						>
							Reload Page
						</button>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}
