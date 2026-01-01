"use client"

import { MessageCircle } from "lucide-react"
import { motion } from "framer-motion"

interface SupportBubbleProps {
	onClick: () => void
	unreadCount?: number
}

/**
 * Floating support chat bubble button
 * Appears in the bottom right corner with animations
 */
export function SupportBubble({ onClick, unreadCount = 0 }: SupportBubbleProps) {
	return (
		<motion.button
			initial={{ scale: 0, opacity: 0 }}
			animate={{ scale: 1, opacity: 1 }}
			exit={{ scale: 0, opacity: 0 }}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			transition={{
				type: "spring",
				stiffness: 260,
				damping: 20,
			}}
			onClick={onClick}
			className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			aria-label="Open support chat"
		>
			{/* Pulsing ring animation */}
			<motion.div
				className="absolute inset-0 rounded-full bg-blue-600"
				animate={{
					scale: [1, 1.2, 1],
					opacity: [0.5, 0, 0.5],
				}}
				transition={{
					duration: 2,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			/>

			{/* Icon */}
			<MessageCircle className="relative z-10 h-6 w-6" />

			{/* Unread badge */}
			{unreadCount > 0 && (
				<motion.div
					initial={{ scale: 0 }}
					animate={{ scale: 1 }}
					className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
				>
					{unreadCount > 9 ? "9+" : unreadCount}
				</motion.div>
			)}
		</motion.button>
	)
}
