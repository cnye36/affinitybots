"use client"

import { useEffect } from "react"

/**
 * Global error handler component
 * Initializes error handlers for unhandled promise rejections and errors
 */
export function GlobalErrorHandler() {
	useEffect(() => {
		// Handle unhandled promise rejections
		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			console.error("Unhandled promise rejection:", event.reason)
			// Prevent default browser error handling
			event.preventDefault()
			
			// Log to console in development
			if (process.env.NODE_ENV === "development") {
				console.error("Stack trace:", event.reason?.stack)
			}
		}

		// Handle uncaught errors
		const handleError = (event: ErrorEvent) => {
			console.error("Uncaught error:", event.error)
			
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

		window.addEventListener("unhandledrejection", handleUnhandledRejection)
		window.addEventListener("error", handleError)

		return () => {
			window.removeEventListener("unhandledrejection", handleUnhandledRejection)
			window.removeEventListener("error", handleError)
		}
	}, [])

	return null
}
