/**
 * Global error handler for unhandled promise rejections and errors
 * This prevents the dev server from crashing silently
 */

if (typeof window !== "undefined") {
	// Handle unhandled promise rejections
	window.addEventListener("unhandledrejection", (event) => {
		console.error("Unhandled promise rejection:", event.reason)
		// Prevent default browser error handling
		event.preventDefault()
		
		// Log to console in development
		if (process.env.NODE_ENV === "development") {
			console.error("Stack trace:", event.reason?.stack)
		}
	})

	// Handle uncaught errors
	window.addEventListener("error", (event) => {
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
	})
}
