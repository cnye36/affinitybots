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
 * Only visible on public pages (not in /app routes)
 */
export function SupportWidget() {
	const [isOpen, setIsOpen] = useState(false)
	const pathname = usePathname()

	// Use the support chat hook
	const { messages, isLoading, error, sendMessage, clearChat } = useSupportChat()

	// Determine if widget should be visible
	// Only show on public marketing pages, not in authenticated app
	const publicRoutes = [
		"/",
		"/pricing",
		"/features",
		"/blog",
		"/privacy",
		"/terms",
		"/about",
		"/contact",
	]

	const isPublicPage = publicRoutes.some((route) => {
		// Exact match for homepage, starts with for others (e.g., /blog/post-slug)
		return pathname === route || (route !== "/" && pathname.startsWith(route))
	})

	// Don't render on non-public pages (authenticated app)
	if (!isPublicPage) {
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
