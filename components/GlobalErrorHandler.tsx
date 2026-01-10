"use client"

import { useEffect } from "react"

/**
 * Global error handler component
 * Initializes error handlers for unhandled promise rejections and errors
 */
export function GlobalErrorHandler() {
	useEffect(() => {
		// Suppress ResizeObserver loop warnings
		// This is a known issue with ReactFlow and other libraries that use ResizeObserver
		// The warning is harmless and occurs when ResizeObserver callbacks trigger layout changes
		const resizeObserverLoopErrRe = /^[^(]*ResizeObserver loop/
		const resizeObserverLoopEndRe = /^[^(]*ResizeObserver loop completed/

		const originalConsoleError = console.error.bind(console)
		console.error = (...args: unknown[]) => {
			if (
				args.length > 0 &&
				typeof args[0] === "string" &&
				(resizeObserverLoopErrRe.test(args[0]) || resizeObserverLoopEndRe.test(args[0]))
			) {
				// Suppress ResizeObserver warnings
				return
			}
			originalConsoleError(...args)
		}

		// Handle unhandled promise rejections
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			// Only log actual errors, not null/undefined rejections
			if (event.reason != null) {
				console.error("Unhandled promise rejection:", event.reason)
				// Prevent default browser error handling
				event.preventDefault()
				
				// Log to console in development
				if (process.env.NODE_ENV === "development") {
					console.error("Stack trace:", event.reason?.stack)
				}
			}
		}

		// Handle uncaught errors
		const handleError = (event: ErrorEvent) => {
			// Skip ResizeObserver errors (already handled above)
			if (event.message && /ResizeObserver/.test(event.message)) {
				event.preventDefault()
				return
			}

			// Only log actual errors or meaningful error messages
			// event.error can be null for resource loading errors (e.g., images, scripts)
			if (event.error != null || (event.message && event.message.trim())) {
				console.error("Uncaught error:", event.error || event.message)
				
				// Prevent default browser error handling
				event.preventDefault()
				
				// Log to console in development
				if (process.env.NODE_ENV === "development") {
					console.error("Error details:", {
						message: event.message,
						filename: event.filename,
						lineno: event.lineno,
						colno: event.colno,
						error: event.error,
					})
				}
			}
		}

		window.addEventListener("unhandledrejection", handleUnhandledRejection)
		window.addEventListener("error", handleError)

		return () => {
			console.error = originalConsoleError
			window.removeEventListener("unhandledrejection", handleUnhandledRejection)
			window.removeEventListener("error", handleError)
		}
	}, [])

	return null
}
