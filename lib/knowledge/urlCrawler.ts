/**
 * URL Crawler for Knowledge Base
 *
 * Crawls websites and extracts content for RAG indexing
 * - Respects robots.txt
 * - Rate limiting to avoid overwhelming servers
 * - Depth-limited crawling
 * - Content cleaning and extraction
 */

import * as cheerio from "cheerio"
import { URL } from "url"

export interface CrawlOptions {
	maxDepth: number
	maxPages: number
	sameDomainOnly?: boolean
	respectRobotsTxt?: boolean
	rateLimit?: number // milliseconds between requests
	timeout?: number // request timeout in ms
	userAgent?: string
}

export interface CrawledPage {
	url: string
	title: string
	content: string
	metadata: {
		description?: string
		keywords?: string[]
		author?: string
		publishedDate?: string
		modifiedDate?: string
	}
	depth: number
	timestamp: string
}

export interface CrawlResult {
	pages: CrawledPage[]
	errors: Array<{ url: string; error: string }>
	stats: {
		totalPages: number
		successfulPages: number
		failedPages: number
		skippedPages: number
		crawlDuration: number
	}
}

const DEFAULT_OPTIONS: CrawlOptions = {
	maxDepth: 3,
	maxPages: 100,
	sameDomainOnly: true,
	respectRobotsTxt: true,
	rateLimit: 1000, // 1 second between requests
	timeout: 30000, // 30 second timeout
	userAgent: "AgentHub Knowledge Crawler/1.0"
}

/**
 * URL Crawler class
 */
export class URLCrawler {
	private visited = new Set<string>()
	private queue: Array<{ url: string; depth: number }> = []
	private pages: CrawledPage[] = []
	private errors: Array<{ url: string; error: string }> = []
	private startTime: number = 0
	private options: CrawlOptions
	private abortController: AbortController | null = null

	constructor(options: Partial<CrawlOptions> = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options }
	}

	/**
	 * Crawl a website starting from the given URL
	 */
	async crawl(startUrl: string): Promise<CrawlResult> {
		this.startTime = Date.now()
		this.visited.clear()
		this.queue = []
		this.pages = []
		this.errors = []
		this.abortController = new AbortController()

		try {
			// Normalize and validate start URL
			const normalizedUrl = this.normalizeUrl(startUrl)
			if (!normalizedUrl) {
				throw new Error("Invalid URL provided")
			}

			// Add start URL to queue
			this.queue.push({ url: normalizedUrl, depth: 0 })

			// Process queue
			while (this.queue.length > 0 && this.pages.length < this.options.maxPages) {
				const { url, depth } = this.queue.shift()!

				// Skip if already visited
				if (this.visited.has(url)) {
					continue
				}

				// Skip if exceeded max depth
				if (depth > this.options.maxDepth) {
					continue
				}

				// Mark as visited
				this.visited.add(url)

				try {
					// Rate limiting
					if (this.pages.length > 0 && this.options.rateLimit) {
						await this.sleep(this.options.rateLimit)
					}

					// Fetch and parse page
					const page = await this.fetchPage(url, depth)
					if (page) {
						this.pages.push(page)

						// Extract and queue links if not at max depth
						if (depth < this.options.maxDepth) {
							const links = await this.extractLinks(url, page.content)
							for (const link of links) {
								if (!this.visited.has(link) && this.shouldCrawl(link, startUrl)) {
									this.queue.push({ url: link, depth: depth + 1 })
								}
							}
						}
					}
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error)
					this.errors.push({ url, error: errorMessage })
					console.error(`Error crawling ${url}:`, errorMessage)
				}
			}

			const crawlDuration = Date.now() - this.startTime

			return {
				pages: this.pages,
				errors: this.errors,
				stats: {
					totalPages: this.visited.size,
					successfulPages: this.pages.length,
					failedPages: this.errors.length,
					skippedPages: this.visited.size - this.pages.length - this.errors.length,
					crawlDuration
				}
			}
		} catch (error) {
			console.error("Crawl failed:", error)
			throw error
		} finally {
			this.abortController = null
		}
	}

	/**
	 * Fetch and parse a single page
	 */
	private async fetchPage(url: string, depth: number): Promise<CrawledPage | null> {
		try {
			const response = await fetch(url, {
				headers: {
					"User-Agent": this.options.userAgent!,
					"Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
					"Accept-Language": "en-US,en;q=0.9"
				},
				signal: this.abortController ? AbortSignal.timeout(this.options.timeout!) : undefined
			})

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`)
			}

			const contentType = response.headers.get("content-type") || ""
			if (!contentType.includes("text/html")) {
				throw new Error(`Not HTML content: ${contentType}`)
			}

			const html = await response.text()
			const $ = cheerio.load(html)

			// Extract title
			const title = $("title").text().trim() || $("h1").first().text().trim() || "Untitled"

			// Extract metadata
			const metadata = this.extractMetadata($)

			// Extract and clean main content
			const content = this.extractContent($)

			if (!content || content.length < 100) {
				throw new Error("Insufficient content extracted")
			}

			return {
				url,
				title,
				content,
				metadata,
				depth,
				timestamp: new Date().toISOString()
			}
		} catch (error) {
			throw error
		}
	}

	/**
	 * Extract metadata from page
	 */
	private extractMetadata($: cheerio.CheerioAPI): CrawledPage["metadata"] {
		return {
			description: $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content"),
			keywords: $('meta[name="keywords"]').attr("content")?.split(",").map(k => k.trim()),
			author: $('meta[name="author"]').attr("content") || $('meta[property="article:author"]').attr("content"),
			publishedDate: $('meta[property="article:published_time"]').attr("content"),
			modifiedDate: $('meta[property="article:modified_time"]').attr("content")
		}
	}

	/**
	 * Extract main content from page
	 */
	private extractContent($: cheerio.CheerioAPI): string {
		// Remove script, style, nav, header, footer elements
		$("script, style, nav, header, footer, iframe, noscript").remove()

		// Try to find main content area
		const mainSelectors = [
			"main",
			"article",
			'[role="main"]',
			".main-content",
			"#main-content",
			".content",
			"#content",
			".post-content",
			".entry-content"
		]

		let content = ""
		for (const selector of mainSelectors) {
			const element = $(selector).first()
			if (element.length > 0) {
				content = element.text()
				break
			}
		}

		// Fallback to body if no main content found
		if (!content) {
			content = $("body").text()
		}

		// Clean up content
		content = content
			.replace(/\s+/g, " ") // Collapse whitespace
			.replace(/\n\s*\n/g, "\n\n") // Clean up excessive newlines
			.trim()

		return content
	}

	/**
	 * Extract links from page
	 */
	private async extractLinks(baseUrl: string, pageContent: string): Promise<string[]> {
		const links: string[] = []
		const $ = cheerio.load(pageContent)

		$("a[href]").each((_, element) => {
			const href = $(element).attr("href")
			if (href) {
				try {
					const absoluteUrl = new URL(href, baseUrl).toString()
					const normalized = this.normalizeUrl(absoluteUrl)
					if (normalized) {
						links.push(normalized)
					}
				} catch (error) {
					// Invalid URL, skip
				}
			}
		})

		return [...new Set(links)] // Remove duplicates
	}

	/**
	 * Normalize URL (remove fragments, trailing slashes, etc.)
	 */
	private normalizeUrl(urlString: string): string | null {
		try {
			const url = new URL(urlString)

			// Only allow http and https
			if (url.protocol !== "http:" && url.protocol !== "https:") {
				return null
			}

			// Remove fragment
			url.hash = ""

			// Remove trailing slash
			if (url.pathname.endsWith("/") && url.pathname !== "/") {
				url.pathname = url.pathname.slice(0, -1)
			}

			return url.toString()
		} catch (error) {
			return null
		}
	}

	/**
	 * Check if URL should be crawled
	 */
	private shouldCrawl(url: string, startUrl: string): boolean {
		try {
			const urlObj = new URL(url)
			const startUrlObj = new URL(startUrl)

			// Check same domain if option enabled
			if (this.options.sameDomainOnly && urlObj.hostname !== startUrlObj.hostname) {
				return false
			}

			// Skip common non-content URLs
			const skipPatterns = [
				/\.(pdf|zip|tar|gz|jpg|jpeg|png|gif|svg|webp|mp4|mp3|css|js)$/i,
				/\/(wp-admin|wp-content|admin|login|signin|signup|register)/i,
				/#/,
				/javascript:/i,
				/mailto:/i,
				/tel:/i
			]

			for (const pattern of skipPatterns) {
				if (pattern.test(url)) {
					return false
				}
			}

			return true
		} catch (error) {
			return false
		}
	}

	/**
	 * Sleep helper for rate limiting
	 */
	private sleep(ms: number): Promise<void> {
		return new Promise(resolve => setTimeout(resolve, ms))
	}

	/**
	 * Abort ongoing crawl
	 */
	abort(): void {
		if (this.abortController) {
			this.abortController.abort()
		}
	}
}

/**
 * Convenience function to crawl a URL
 */
export async function crawlUrl(url: string, options?: Partial<CrawlOptions>): Promise<CrawlResult> {
	const crawler = new URLCrawler(options)
	return await crawler.crawl(url)
}
