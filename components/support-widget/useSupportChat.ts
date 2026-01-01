import { useState, useEffect, useCallback, useRef } from "react"
import { v4 as uuidv4 } from "uuid"

export interface ChatMessage {
	id: string
	role: "user" | "assistant"
	content: string
	createdAt: Date
}

interface SupportSession {
	sessionId: string
	messages: ChatMessage[]
	createdAt: string
	lastMessageAt: string
}

const STORAGE_KEY = "affinitybots-support-session"
const SESSION_EXPIRY_HOURS = 24

/**
 * Custom hook for managing support chat state and API communication
 * Handles localStorage persistence, session management, and streaming responses
 */
export function useSupportChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([])
	const [sessionId, setSessionId] = useState<string>("")
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const abortControllerRef = useRef<AbortController | null>(null)

	// Load session from localStorage on mount
	useEffect(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)

			if (stored) {
				const session: SupportSession = JSON.parse(stored)

				// Check if session is expired (24 hours)
				const lastMessageTime = new Date(session.lastMessageAt)
				const hoursSinceLastMessage =
					(Date.now() - lastMessageTime.getTime()) / (1000 * 60 * 60)

				if (hoursSinceLastMessage < SESSION_EXPIRY_HOURS) {
					// Session is still valid
					setMessages(
						session.messages.map((msg) => ({
							...msg,
							createdAt: new Date(msg.createdAt),
						}))
					)
					setSessionId(session.sessionId)
					console.log("📦 Loaded session from storage:", session.sessionId)
				} else {
					// Session expired, create new one
					console.log("⏰ Session expired, creating new one")
					const newSessionId = `session_${uuidv4()}`
					setSessionId(newSessionId)
					localStorage.removeItem(STORAGE_KEY)
				}
			} else {
				// No stored session, create new one
				const newSessionId = `session_${uuidv4()}`
				setSessionId(newSessionId)
				console.log("🆕 Created new session:", newSessionId)
			}
		} catch (error) {
			console.error("Failed to load session from storage:", error)
			const newSessionId = `session_${uuidv4()}`
			setSessionId(newSessionId)
		}
	}, [])

	// Save session to localStorage whenever messages change
	useEffect(() => {
		if (sessionId && messages.length > 0) {
			const session: SupportSession = {
				sessionId,
				messages: messages.map((msg) => ({
					...msg,
					createdAt: msg.createdAt.toISOString(),
				})) as any,
				createdAt: messages[0]?.createdAt?.toISOString() || new Date().toISOString(),
				lastMessageAt: new Date().toISOString(),
			}

			localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
		}
	}, [messages, sessionId])

	/**
	 * Send a message to the support chat
	 */
	const sendMessage = useCallback(
		async (content: string) => {
			if (!content.trim() || isLoading) return

			setIsLoading(true)
			setError(null)

			// Create user message
			const userMessage: ChatMessage = {
				id: uuidv4(),
				role: "user",
				content: content.trim(),
				createdAt: new Date(),
			}

			// Add user message immediately
			setMessages((prev) => [...prev, userMessage])

			// Create abort controller for this request
			const abortController = new AbortController()
			abortControllerRef.current = abortController

			try {
				// Call support chat API
				const response = await fetch("/api/support/chat", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						"x-support-session-id": sessionId,
					},
					body: JSON.stringify({
						messages: [...messages, userMessage].map((msg) => ({
							role: msg.role,
							content: msg.content,
						})),
					}),
					signal: abortController.signal,
				})

				if (!response.ok) {
					if (response.status === 429) {
						throw new Error("Too many messages. Please wait a few minutes and try again.")
					}
					throw new Error(`Failed to send message: ${response.statusText}`)
				}

				// Parse streaming response
				const reader = response.body?.getReader()
				const decoder = new TextDecoder()

				if (!reader) {
					throw new Error("No response stream")
				}

				let assistantMessageId = uuidv4()
				let assistantContent = ""
				let isFirstChunk = true

				while (true) {
					const { done, value } = await reader.read()

					if (done) break

					const chunk = decoder.decode(value, { stream: true })
					const lines = chunk.split("\n")

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							try {
								const data = JSON.parse(line.slice(6))

								// Handle different event types
								if (Array.isArray(data)) {
									// Messages array from LangGraph
									const aiMessage = data.find((msg: any) => msg.type === "ai")
									if (aiMessage && aiMessage.content) {
										assistantContent = typeof aiMessage.content === "string"
											? aiMessage.content
											: JSON.stringify(aiMessage.content)

										if (isFirstChunk) {
											// Add initial assistant message
											setMessages((prev) => [
												...prev,
												{
													id: assistantMessageId,
													role: "assistant",
													content: assistantContent,
													createdAt: new Date(),
												},
											])
											isFirstChunk = false
										} else {
											// Update existing assistant message
											setMessages((prev) =>
												prev.map((msg) =>
													msg.id === assistantMessageId
														? { ...msg, content: assistantContent }
														: msg
												)
											)
										}
									}
								}
							} catch (e) {
								// Ignore parsing errors for non-JSON lines
							}
						} else if (line.startsWith("event: error")) {
							const nextLine = lines[lines.indexOf(line) + 1]
							if (nextLine?.startsWith("data: ")) {
								try {
									const errorData = JSON.parse(nextLine.slice(6))
									throw new Error(errorData.error || "Unknown error")
								} catch (e) {
									throw new Error("An error occurred while processing your message")
								}
							}
						}
					}
				}

				console.log("✅ Message sent successfully")
			} catch (error: any) {
				if (error.name === "AbortError") {
					console.log("Request was cancelled")
					return
				}

				console.error("Failed to send message:", error)
				setError(error.message || "Failed to send message")

				// Remove the user message on error (optional - you might want to keep it)
				setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id))
			} finally {
				setIsLoading(false)
				abortControllerRef.current = null
			}
		},
		[messages, sessionId, isLoading]
	)

	/**
	 * Clear the chat history and start fresh
	 */
	const clearChat = useCallback(() => {
		setMessages([])
		const newSessionId = `session_${uuidv4()}`
		setSessionId(newSessionId)
		localStorage.removeItem(STORAGE_KEY)
		console.log("🗑️ Chat cleared, new session:", newSessionId)
	}, [])

	/**
	 * Cancel the current request
	 */
	const cancelRequest = useCallback(() => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
			setIsLoading(false)
		}
	}, [])

	return {
		messages,
		sessionId,
		isLoading,
		error,
		sendMessage,
		clearChat,
		cancelRequest,
	}
}
