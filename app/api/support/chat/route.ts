import { NextRequest } from "next/server"
import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"
import { checkSupportRateLimit } from "@/lib/support/supportRateLimiting"
import { SUPPORT_ASSISTANT_PROMPT } from "@/lib/agent/prompts/supportAssistant"

/**
 * Public support chat endpoint
 * No authentication required - open to all visitors
 * Rate limited by IP address to prevent abuse
 * Uses OpenAI directly via AI SDK for simplicity
 */

/**
 * Extract client IP from request headers
 */
function getClientIP(request: NextRequest): string {
	const forwarded = request.headers.get("x-forwarded-for")
	const realIP = request.headers.get("x-real-ip")
	const cfConnectingIP = request.headers.get("cf-connecting-ip") // Cloudflare

	if (forwarded) {
		// x-forwarded-for can be comma-separated list, take first
		return forwarded.split(",")[0].trim()
	}

	if (cfConnectingIP) {
		return cfConnectingIP
	}

	if (realIP) {
		return realIP
	}

	return "unknown"
}

export async function POST(request: NextRequest) {
	const startTime = Date.now()

	try {
		// 1. Extract client IP for rate limiting
		const clientIP = getClientIP(request)

		console.log("\n" + "=".repeat(80))
		console.log("🎯 SUPPORT CHAT REQUEST")
		console.log("=".repeat(80))
		console.log("Timestamp:", new Date().toISOString())
		console.log("Client IP:", clientIP)

		// 2. Check rate limit
		const rateLimitAllowed = await checkSupportRateLimit(clientIP)

		if (!rateLimitAllowed) {
			console.log("❌ Rate limit exceeded for IP:", clientIP)
			console.log("=".repeat(80) + "\n")

			return new Response(
				JSON.stringify({
					error: "Rate limit exceeded. Please try again in a few minutes.",
					retryAfter: 600,
				}),
				{
					status: 429,
					headers: {
						"Content-Type": "application/json",
						"Retry-After": "600",
					},
				}
			)
		}

		// 3. Parse request body
		const body = await request.json()
		const { messages } = body

		if (!messages || !Array.isArray(messages)) {
			console.log("❌ Invalid request: messages array required")
			console.log("=".repeat(80) + "\n")

			return new Response(
				JSON.stringify({ error: "Invalid request: messages array required" }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			)
		}

		console.log("Message count:", messages.length)
		console.log("Last message:", messages[messages.length - 1]?.content?.substring(0, 100))

		// 4. Stream response from OpenAI
		console.log("📤 Streaming request to OpenAI...")

		const result = streamText({
			model: openai("gpt-4o-mini"),
			system: SUPPORT_ASSISTANT_PROMPT,
			messages: messages.map((msg: any) => ({
				role: msg.role,
				content: msg.content,
			})),
			temperature: 0.7,
		})

		console.log("✅ Stream established")

		// 5. Convert AI SDK stream to NDJSON format for frontend compatibility
		const encoder = new TextEncoder()
		const stream = new ReadableStream({
			async start(controller) {
				try {
					let fullContent = ""

					for await (const chunk of result.textStream) {
						fullContent += chunk

						// Send update in NDJSON format compatible with frontend parser
						const eventData = `data: ${JSON.stringify([
							{
								type: "ai",
								content: fullContent,
							},
						])}\n\n`
						controller.enqueue(encoder.encode(eventData))
					}

					const elapsed = Date.now() - startTime
					console.log("✅ SUPPORT CHAT COMPLETED")
					console.log("Elapsed time:", elapsed, "ms")
					console.log("=".repeat(80) + "\n")

					controller.close()
				} catch (error) {
					const elapsed = Date.now() - startTime
					console.error("❌ SUPPORT CHAT FAILED")
					console.error("Error:", error)
					console.error("Elapsed time:", elapsed, "ms")
					console.error("=".repeat(80) + "\n")

					// Send error event
					const errorEvent = `event: error\ndata: ${JSON.stringify({
						error: error instanceof Error ? error.message : "Unknown error",
					})}\n\n`
					controller.enqueue(encoder.encode(errorEvent))
					controller.close()
				}
			},
		})

		// 6. Return streaming response
		return new Response(stream, {
			headers: {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			},
		})
	} catch (error) {
		const elapsed = Date.now() - startTime
		console.error("❌ SUPPORT CHAT REQUEST FAILED")
		console.error("Error:", error)
		console.error("Elapsed time:", elapsed, "ms")
		console.error("=".repeat(80) + "\n")

		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Internal server error",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			}
		)
	}
}
