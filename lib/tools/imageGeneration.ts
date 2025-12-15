import { DynamicStructuredTool } from "@langchain/core/tools"
import { z } from "zod"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

/**
 * Helper function to create a timeout promise
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
	return new Promise((_, reject) => {
		setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
	})
}

async function fetchWithTimeout(
	url: string,
	init: RequestInit,
	timeoutMs: number
): Promise<Response> {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), timeoutMs)
	try {
		return await fetch(url, { ...init, signal: controller.signal })
	} finally {
		clearTimeout(timeout)
	}
}

/**
 * Upload image to Supabase storage
 */
async function uploadImageToSupabase(
	imageUrl: string,
	fileName: string,
	bucketName: string,
	ownerId: string
): Promise<string> {
	const supabase = getSupabaseAdmin()

	try {
		// Fetch the image from the URL with timeout
		const response = await Promise.race([
			fetch(imageUrl),
			createTimeoutPromise(30000) // 30 second timeout
		])
		
		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
		}
		
		const imageBlob = await response.blob()

		// Upload to Supabase Storage
		const safeOwnerId = ownerId || "unknown"
		const filePath = `${safeOwnerId}/${fileName}.png`

		const { error, data: uploadData } = await supabase.storage
			.from(bucketName)
			.upload(filePath, imageBlob, {
				contentType: "image/png",
				upsert: true,
			})

		if (error) {
			throw error
		}

		// Get public URL
		const {
			data: { publicUrl },
		} = supabase.storage.from(bucketName).getPublicUrl(filePath)

		return publicUrl
	} catch (error) {
		console.error("Failed to upload image to Supabase:", error)
		throw error
	}
}

async function uploadPngBytesToSupabase(
	pngBytes: Uint8Array,
	fileName: string,
	bucketName: string,
	ownerId: string
): Promise<string> {
	const supabase = getSupabaseAdmin()

	const safeOwnerId = ownerId || "unknown"
	const filePath = `${safeOwnerId}/${fileName}.png`

	const { error } = await supabase.storage
		.from(bucketName)
		.upload(filePath, pngBytes, {
			contentType: "image/png",
			upsert: true,
		})

	if (error) throw error

	const {
		data: { publicUrl },
	} = supabase.storage.from(bucketName).getPublicUrl(filePath)

	return publicUrl
}

function base64ToUint8Array(base64: string): Uint8Array {
	const normalized = base64.replace(/\s/g, "")
	const buffer = Buffer.from(normalized, "base64")
	return new Uint8Array(buffer)
}

/**
 * Built-in image generation tool using DALL-E 3
 * This tool allows agents to generate images on demand
 */
export function createImageGenerationTool(options?: { ownerId?: string }): DynamicStructuredTool<any, any, any, string> {
	return new DynamicStructuredTool({
		name: "generate_image",
		description: `Generate an image based on a text prompt.

This tool is provider-backed (OpenAI or Gemini) and returns a public URL.
Use this tool when the user asks you to create, generate, or make an image, picture, illustration, or visual content.
The tool will create a high-quality image and return a public URL that can be shared or embedded.`,
		schema: z.object({
			prompt: z.string().describe("A detailed description of the image to generate. Be specific about style, composition, colors, mood, and any important details."),
			size: z.enum(["auto", "1024x1024", "1536x1024", "1024x1536", "1792x1024", "1024x1792"]).optional().describe("Image dimensions. Default is 1024x1024. Use 1536x1024 for landscape or 1024x1536 for portrait. If a provider doesn't support the requested size, it will be mapped to the closest supported size."),
			provider: z.enum(["openai", "gemini"]).optional().describe("Optional: force the image provider. Defaults to IMAGE_PROVIDER env or best available."),
			model: z.string().optional().describe("Optional: override the underlying image model name."),
		}),
		func: async ({ prompt, size = "1024x1024", provider, model }) => {
			try {
				const resolvedOwnerId = options?.ownerId || "unknown"
				const envProvider = process.env.IMAGE_PROVIDER as "openai" | "gemini" | undefined
				const resolvedProvider =
					provider ||
					envProvider ||
					(process.env.OPENAI_API_KEY ? "openai" : process.env.GOOGLE_API_KEY ? "gemini" : undefined)

				if (!resolvedProvider) {
					throw new Error("No image provider configured. Set OPENAI_API_KEY or GOOGLE_API_KEY (and optionally IMAGE_PROVIDER).")
				}

				console.log("🎨 generate_image called", {
					size,
					promptPreview: prompt.slice(0, 120),
					hasOpenAIKey: !!process.env.OPENAI_API_KEY,
					hasGoogleKey: !!process.env.GOOGLE_API_KEY,
					hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
					hasSupabaseServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
					ownerIdPrefix: resolvedOwnerId.slice(0, 8),
					provider: resolvedProvider,
					modelOverride: model || null,
				})
				
				if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
					console.warn("Supabase admin env missing; will fall back to direct OpenAI URL if upload fails.")
				}
				
				const normalizeSizeForOpenAI = (requested: string) => {
					if (requested === "1792x1024") return "1536x1024"
					if (requested === "1024x1792") return "1024x1536"
					return requested
				}

				const isAuto = size === "auto"
				const [width, height] = isAuto ? [NaN, NaN] : size.split("x").map(Number)
				if (!isAuto && (!Number.isFinite(width) || !Number.isFinite(height))) {
					throw new Error(`Invalid size: ${size}`)
				}
				
				// Generate a unique filename
				const fileName = `generated-${Date.now()}-${Math.random().toString(36).substring(7)}`
				const asMarkdown = (url: string) =>
					[
						`![Generated image](${url})`,
						"",
						`[Download image](${url})`,
					].join("\n")

				if (resolvedProvider === "openai") {
					if (!process.env.OPENAI_API_KEY) {
						throw new Error("OPENAI_API_KEY is not configured. OpenAI image generation is not available.")
					}

					const openAiModel = model || process.env.OPENAI_IMAGE_MODEL || "gpt-image-1"
					const openAiSize = normalizeSizeForOpenAI(size)
					const started = Date.now()
					const response = await fetchWithTimeout(
						"https://api.openai.com/v1/images/generations",
						{
							method: "POST",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
							},
							body: JSON.stringify({
								model: openAiModel,
								prompt,
								n: 1,
								size: openAiSize,
							}),
						},
						120000
					)
					console.log("OpenAI images.generation completed", {
						ms: Date.now() - started,
						size: openAiSize,
						model: openAiModel,
						status: response.status,
					})

					if (!response.ok) {
						const errorData = await response.json().catch(() => ({}))
						console.error("OpenAI image generations error", {
							status: response.status,
							statusText: response.statusText,
							errorData,
						})
						throw new Error(
							`OpenAI API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`
						)
					}

					const data = await response.json()
					const first = data?.data?.[0]
					const imageUrl: string | undefined = first?.url
					const b64: string | undefined = first?.b64_json

					if (!imageUrl && !b64) {
						console.error("Unexpected OpenAI images response", data)
						throw new Error("Invalid response format from OpenAI image API (expected url or b64_json).")
					}

					if (b64) {
						const pngBytes = base64ToUint8Array(b64)
						const publicUrl = await Promise.race([
							uploadPngBytesToSupabase(pngBytes, fileName, "agent-avatars", resolvedOwnerId),
							createTimeoutPromise(60000),
						])
						return asMarkdown(publicUrl)
					}

					// URL flow
					try {
						const publicUrl = await Promise.race([
							uploadImageToSupabase(imageUrl!, fileName, "agent-avatars", resolvedOwnerId),
							createTimeoutPromise(60000),
						])
						return asMarkdown(publicUrl)
					} catch (uploadError) {
						console.warn("Failed to upload to Supabase, returning direct URL:", uploadError)
						return asMarkdown(imageUrl!)
					}
				}

				// Gemini (Nano Banana) flow: generateContent returns base64 inlineData
				if (!process.env.GOOGLE_API_KEY) {
					throw new Error("GOOGLE_API_KEY is not configured. Gemini image generation is not available.")
				}

				const geminiModel = model || process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image"
				const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${process.env.GOOGLE_API_KEY}`

				const geminiStarted = Date.now()
				const geminiResponse = await fetchWithTimeout(
					geminiUrl,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							contents: [{ parts: [{ text: prompt }] }],
						}),
					},
					120000
				)
				console.log("Gemini generateContent completed", {
					ms: Date.now() - geminiStarted,
					model: geminiModel,
					status: geminiResponse.status,
				})

				if (!geminiResponse.ok) {
					const errorData = await geminiResponse.json().catch(() => ({}))
					console.error("Gemini generateContent error", {
						status: geminiResponse.status,
						statusText: geminiResponse.statusText,
						errorData,
					})
					throw new Error(
						`Gemini API error: ${geminiResponse.status} ${geminiResponse.statusText}. ${JSON.stringify(errorData)}`
					)
				}

				const geminiData = await geminiResponse.json()
				const parts: any[] = geminiData?.candidates?.[0]?.content?.parts || []
				const inline = parts.find((p) => p?.inlineData?.data)
				const base64Image: string | undefined = inline?.inlineData?.data
				const mimeType: string | undefined = inline?.inlineData?.mimeType

				if (!base64Image) {
					console.error("Unexpected Gemini response (no inlineData)", geminiData)
					throw new Error("Invalid response format from Gemini (expected inlineData image).")
				}
				if (mimeType && mimeType !== "image/png" && mimeType !== "image/jpeg") {
					console.warn("Gemini returned unexpected mime type", { mimeType })
				}

				const pngBytes = base64ToUint8Array(base64Image)
				const publicUrl = await Promise.race([
					uploadPngBytesToSupabase(pngBytes, fileName, "agent-avatars", resolvedOwnerId),
					createTimeoutPromise(60000),
				])

				return asMarkdown(publicUrl)
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : String(error)
				console.error("Image generation error:", { errorMessage, error })
				return `Failed to generate image: ${errorMessage}. Please try again with a different prompt or check if the image generation service is available.`
			}
		},
	})
}

