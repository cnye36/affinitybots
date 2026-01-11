"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"
import { SupportBubble } from "./SupportBubble"
import { SupportChat } from "./SupportChat"
import { useSupportChat } from "./useSupportChat"

/**
 * Main support widget container
 * Manages state and conditionally renders bubble or chat window
 * Visible on all public pages (anywhere auth isn't required)
 * Hidden on authenticated app routes (dashboard, agents, workflows, etc.)
 */
export function SupportWidget() {
	const [isOpen, setIsOpen] = useState(false)
	const pathname = usePathname()

	// Use the support chat hook
	const { messages, isLoading, error, sendMessage, clearChat } = useSupportChat()

	// Determine if widget should be visible
	// Show on all public pages (anywhere auth isn't required)
	// Hide only on authenticated app routes
	const authenticatedRoutes = [
		"/dashboard",
		"/agents",
		"/analytics",
		"/admin",
		"/playground",
		"/settings",
		"/tools",
		"/workflows",
		"/use-case-demo",
	]

	const isAuthenticatedRoute = authenticatedRoutes.some((route) => {
		return pathname.startsWith(route)
	})

	// Don't render on authenticated app routes
	if (isAuthenticatedRoute) {
		return null
	}

	const handleClose = () => {
		setIsOpen(false)
	}

	const handleOpen = () => {
		setIsOpen(true)
	}

	return (
		<>
			<AnimatePresence>
				{!isOpen && <SupportBubble onClick={handleOpen} />}
			</AnimatePresence>

			<AnimatePresence>
				{isOpen && (
					<SupportChat
						messages={messages}
						isLoading={isLoading}
						error={error}
						onSendMessage={sendMessage}
						onClose={handleClose}
						onClearChat={clearChat}
					/>
				)}
			</AnimatePresence>
		</>
	)
}
