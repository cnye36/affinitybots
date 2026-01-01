"use client"

import { X, Trash2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { ChatMessage } from "./useSupportChat"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism"

interface SupportChatProps {
	messages: ChatMessage[]
	isLoading: boolean
	error: string | null
	onSendMessage: (content: string) => void
	onClose: () => void
	onClearChat: () => void
}

/**
 * Support chat window component
 * Displays chat messages and input for the support chatbot
 */
export function SupportChat({
	messages,
	isLoading,
	error,
	onSendMessage,
	onClose,
	onClearChat,
}: SupportChatProps) {
	const [input, setInput] = useState("")
	const messagesEndRef = useRef<HTMLDivElement>(null)

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
	}, [messages])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (!input.trim() || isLoading) return

		onSendMessage(input)
		setInput("")
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 20, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			exit={{ opacity: 0, y: 20, scale: 0.95 }}
			transition={{ type: "spring", damping: 20, stiffness: 300 }}
			className="fixed bottom-24 right-6 z-50 flex h-[600px] w-96 flex-col overflow-hidden rounded-lg border border-border bg-background shadow-2xl md:bottom-6"
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
				<div className="flex items-center gap-2">
					<div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
					<h3 className="font-semibold">AffinityBots Support</h3>
				</div>
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={onClearChat}
						className="h-8 w-8 p-0 text-white hover:bg-white/20"
						title="Clear chat"
					>
						<Trash2 className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0 text-white hover:bg-white/20"
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{/* Messages */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{messages.length === 0 ? (
					<div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
						<p className="text-sm font-medium">👋 Hi! I'm here to help.</p>
						<p className="mt-2 text-xs">
							Ask me anything about AffinityBots, pricing, features, or how to get started!
						</p>
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
						>
							{message.role === "user" ? (
								<div className="max-w-[80%] rounded-lg bg-blue-600 px-4 py-2 text-sm text-white">
									{message.content}
								</div>
							) : (
								<div className="max-w-[85%] rounded-lg bg-muted px-4 py-3 text-sm">
									<ReactMarkdown
										className="prose prose-sm dark:prose-invert max-w-none"
										components={{
											code({ node, inline, className, children, ...props }: any) {
												const match = /language-(\w+)/.exec(className || "")
												return !inline && match ? (
													<SyntaxHighlighter
														style={oneDark as any}
														language={match[1]}
														PreTag="div"
														{...props}
													>
														{String(children).replace(/\n$/, "")}
													</SyntaxHighlighter>
												) : (
													<code className={className} {...props}>
														{children}
													</code>
												)
											},
										}}
									>
										{message.content}
									</ReactMarkdown>
								</div>
							)}
						</div>
					))
				)}

				{/* Loading indicator */}
				{isLoading && (
					<div className="flex justify-start">
						<div className="rounded-lg bg-muted px-4 py-3">
							<div className="flex gap-1">
								<div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" />
								<div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: "0.1s" }} />
								<div className="h-2 w-2 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: "0.2s" }} />
							</div>
						</div>
					</div>
				)}

				{/* Error message */}
				{error && (
					<div className="rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 px-4 py-2 text-sm text-red-800 dark:text-red-300">
						{error}
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Input */}
			<form onSubmit={handleSubmit} className="border-t border-border bg-background p-4">
				<div className="flex gap-2">
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Type your question..."
						className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
						disabled={isLoading}
					/>
					<Button
						type="submit"
						disabled={!input.trim() || isLoading}
						className="bg-blue-600 hover:bg-blue-700"
					>
						Send
					</Button>
				</div>
			</form>

			{/* Footer */}
			<div className="border-t border-border bg-muted/50 px-4 py-2 text-center text-xs text-muted-foreground">
				Powered by <span className="font-semibold text-foreground">AffinityBots</span>
			</div>
		</motion.div>
	)
}
