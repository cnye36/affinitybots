import { NextResponse } from "next/server"
import { createClient } from "@/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { OpenAIEmbeddings } from "@langchain/openai"
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { crawlUrl } from "@/lib/knowledge/urlCrawler"
import { getUserPlanType } from "@/lib/subscription/usage"
import { getPlanLimits } from "@/lib/subscription/limits"

export async function POST(req: Request) {
	try {
		const { url, assistantId } = await req.json()

		if (!url || typeof url !== "string") {
			return NextResponse.json({ error: "Valid URL is required" }, { status: 400 })
		}

		if (!assistantId || typeof assistantId !== "string") {
			return NextResponse.json({ error: "Valid assistant ID is required" }, { status: 400 })
		}

		// Validate URL format
		try {
			new URL(url)
		} catch (error) {
			return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
		}

		// Authenticate user
		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		// Get user's plan type and limits
		const planType = await getUserPlanType(user.id)
		const limits = getPlanLimits(planType)

		console.log(`[URL Indexing] User ${user.id} (${planType}) indexing URL: ${url}`)

		// Check if URL already indexed for this assistant
		const serviceClient = createServiceClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		const { data: existingUrl } = await serviceClient
			.from("document_vectors")
			.select("id")
			.eq("metadata->>assistant_id", assistantId)
			.eq("metadata->>source_url", url)
			.limit(1)
			.maybeSingle()

		if (existingUrl) {
			return NextResponse.json({
				error: "This URL has already been indexed for this assistant"
			}, { status: 400 })
		}

		// Count existing URLs for this assistant
		const { data: existingUrls } = await serviceClient
			.from("document_vectors")
			.select("metadata->>source_url", { count: "exact", head: false })
			.eq("metadata->>assistant_id", assistantId)
			.not("metadata->>source_url", "is", null)

		const uniqueUrls = new Set(existingUrls?.map(v => v.source_url) || [])
		const currentUrlCount = uniqueUrls.size

		console.log(`[URL Indexing] Current URL count: ${currentUrlCount}/${limits.maxKnowledgeURLs}`)

		// Check limit
		if (currentUrlCount >= limits.maxKnowledgeURLs) {
			return NextResponse.json({
				error: `URL limit reached. Your ${limits.displayName} plan allows ${limits.maxKnowledgeURLs} URLs per assistant. Upgrade for more.`,
				currentCount: currentUrlCount,
				limit: limits.maxKnowledgeURLs
			}, { status: 403 })
		}

		// Crawl the URL
		console.log(`[URL Indexing] Starting crawl with depth=${limits.maxURLCrawlDepth}, maxPages=${limits.maxPagesPerURL}`)

		const crawlResult = await crawlUrl(url, {
			maxDepth: limits.maxURLCrawlDepth,
			maxPages: limits.maxPagesPerURL,
			sameDomainOnly: true,
			rateLimit: 1000, // 1 second between requests
			timeout: 30000 // 30 second timeout per page
		})

		console.log(`[URL Indexing] Crawl complete: ${crawlResult.stats.successfulPages} pages, ${crawlResult.stats.failedPages} errors`)

		if (crawlResult.pages.length === 0) {
			return NextResponse.json({
				error: "Could not extract any content from the URL",
				details: crawlResult.errors
			}, { status: 400 })
		}

		// Create document entry
		const { data: documentEntry, error: docError } = await serviceClient
			.from("documents")
			.insert({
				filename: `${new URL(url).hostname} - Crawled Website`,
				type: "text/html",
				size: crawlResult.pages.reduce((sum, page) => sum + page.content.length, 0)
			})
			.select("id")
			.single()

		if (docError || !documentEntry) {
			console.error("[URL Indexing] Error creating document entry:", docError)
			return NextResponse.json(
				{ error: "Failed to create document entry" },
				{ status: 500 }
			)
		}

		const documentId = documentEntry.id
		console.log(`[URL Indexing] Created document entry: ${documentId}`)

		// Process pages and create embeddings
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200
		})

		const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" })

		let totalChunks = 0
		const processedPages: Array<{ url: string; chunks: number }> = []

		for (const page of crawlResult.pages) {
			try {
				// Create document for this page
				const doc = {
					pageContent: page.content,
					metadata: {
						source: page.url,
						title: page.title,
						...page.metadata
					}
				}

				// Split into chunks
				const chunks = await textSplitter.splitDocuments([doc])

				// Add metadata to each chunk
				const chunksWithMetadata = chunks.map((chunk, index) => ({
					...chunk,
					metadata: {
						...chunk.metadata,
						assistant_id: assistantId,
						document_id: documentId,
						source_url: url, // Root URL for this crawl
						page_url: page.url, // Specific page URL
						page_title: page.title,
						page_depth: page.depth,
						chunk_index: index,
						total_chunks: chunks.length,
						indexed_at: new Date().toISOString()
					}
				}))

				// Store embeddings
				await SupabaseVectorStore.fromDocuments(chunksWithMetadata, embeddings, {
					client: serviceClient,
					tableName: "document_vectors",
					queryName: "match_documents"
				})

				totalChunks += chunks.length
				processedPages.push({ url: page.url, chunks: chunks.length })

				console.log(`[URL Indexing] Processed ${page.url}: ${chunks.length} chunks`)
			} catch (error) {
				console.error(`[URL Indexing] Error processing page ${page.url}:`, error)
				// Continue with other pages
			}
		}

		console.log(`[URL Indexing] Successfully indexed ${crawlResult.pages.length} pages with ${totalChunks} total chunks`)

		return NextResponse.json({
			success: true,
			url,
			stats: {
				pagesIndexed: crawlResult.pages.length,
				totalChunks,
				errors: crawlResult.errors.length,
				crawlDuration: crawlResult.stats.crawlDuration
			},
			processedPages,
			currentUrlCount: currentUrlCount + 1,
			limit: limits.maxKnowledgeURLs
		})
	} catch (error) {
		console.error("[URL Indexing] Error:", error)
		const message = error instanceof Error ? error.message : "Unknown error occurred"
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

/**
 * Get indexed URLs for an assistant
 */
export async function GET(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const assistantId = searchParams.get("assistantId")

		if (!assistantId) {
			return NextResponse.json({ error: "Assistant ID is required" }, { status: 400 })
		}

		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const serviceClient = createServiceClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		// Get all unique source URLs for this assistant
		const { data: vectors } = await serviceClient
			.from("document_vectors")
			.select("metadata")
			.eq("metadata->>assistant_id", assistantId)
			.not("metadata->>source_url", "is", null)

		// Group by source URL and count pages
		const urlMap = new Map<string, { url: string; pageCount: number; indexedAt: string; title?: string }>()

		for (const vector of vectors || []) {
			const metadata = vector.metadata || {}
			const sourceUrl = metadata.source_url
			if (sourceUrl) {
				if (!urlMap.has(sourceUrl)) {
					urlMap.set(sourceUrl, {
						url: sourceUrl,
						pageCount: 0,
						indexedAt: metadata.indexed_at || new Date().toISOString(),
						title: metadata.page_title
					})
				}
				urlMap.get(sourceUrl)!.pageCount++
			}
		}

		const urls = Array.from(urlMap.values()).sort((a, b) =>
			new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime()
		)

		// Get user limits
		const planType = await getUserPlanType(user.id)
		const limits = getPlanLimits(planType)

		return NextResponse.json({
			urls,
			currentCount: urlMap.size,
			limit: limits.maxKnowledgeURLs
		})
	} catch (error) {
		console.error("[URL Indexing] Error getting URLs:", error)
		return NextResponse.json({ error: "Failed to get indexed URLs" }, { status: 500 })
	}
}

/**
 * Delete indexed URL
 */
export async function DELETE(req: Request) {
	try {
		const { searchParams } = new URL(req.url)
		const assistantId = searchParams.get("assistantId")
		const url = searchParams.get("url")

		if (!assistantId || !url) {
			return NextResponse.json({
				error: "Assistant ID and URL are required"
			}, { status: 400 })
		}

		const supabase = await createClient()
		const { data: { user } } = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const serviceClient = createServiceClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.SUPABASE_SERVICE_ROLE_KEY!
		)

		// Delete all vectors for this URL
		const { error: deleteError } = await serviceClient
			.from("document_vectors")
			.delete()
			.eq("metadata->>assistant_id", assistantId)
			.eq("metadata->>source_url", url)

		if (deleteError) {
			console.error("[URL Indexing] Error deleting URL:", deleteError)
			return NextResponse.json(
				{ error: "Failed to delete URL" },
				{ status: 500 }
			)
		}

		return NextResponse.json({
			success: true,
			message: `URL '${url}' successfully removed`
		})
	} catch (error) {
		console.error("[URL Indexing] Error deleting URL:", error)
		return NextResponse.json({ error: "Failed to delete URL" }, { status: 500 })
	}
}
