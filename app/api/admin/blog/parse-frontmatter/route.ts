import { NextRequest, NextResponse } from "next/server"
import matter from "gray-matter"

export async function POST(request: NextRequest) {
	try {
		const { frontmatterText } = await request.json()

		if (!frontmatterText || typeof frontmatterText !== "string") {
			return NextResponse.json(
				{ error: "Frontmatter text is required and must be a string" },
				{ status: 400 }
			)
		}

		// Wrap in frontmatter delimiters if not already present
		let textToParse = frontmatterText.trim()
		if (!textToParse.startsWith("---")) {
			textToParse = `---\n${textToParse}\n---`
		}

		const { data } = matter(textToParse)

		// Extract cover image from featuredImage or coverImage
		let coverImage = ""
		if (data.coverImage) {
			coverImage = typeof data.coverImage === "string" ? data.coverImage : ""
		} else if (data.featuredImage) {
			if (typeof data.featuredImage === "object" && data.featuredImage.src) {
				coverImage = data.featuredImage.src
			} else if (typeof data.featuredImage === "string") {
				coverImage = data.featuredImage
			}
		}

		// Extract categories - handle both array and single category
		let categories: string[] = []
		if (data.categories) {
			if (Array.isArray(data.categories)) {
				categories = data.categories.filter(
					(cat: any) => cat && typeof cat === "string"
				)
			} else if (typeof data.categories === "string") {
				categories = [data.categories]
			}
		}

		// Extract tags - handle both array and single tag
		let tags: string[] = []
		if (data.tags) {
			if (Array.isArray(data.tags)) {
				tags = data.tags.filter((tag: any) => tag && typeof tag === "string")
			} else if (typeof data.tags === "string") {
				tags = [data.tags]
			}
		}

		const parsed = {
			title: data.title || "",
			slug: data.slug || "",
			excerpt: data.excerpt || data.description || "",
			author: data.author || "",
			categories,
			tags,
			coverImage,
			featured: data.featured || false,
			status: data.status || "",
			date: data.date ? (data.date instanceof Date ? data.date.toISOString().split("T")[0] : String(data.date)) : "",
			featuredImageInfo: data.featuredImage && typeof data.featuredImage === "object" ? data.featuredImage : null,
		}

		return NextResponse.json({ parsed })
	} catch (error) {
		console.error("Error parsing frontmatter:", error)
		return NextResponse.json(
			{ error: "Failed to parse frontmatter. Please check the YAML syntax." },
			{ status: 400 }
		)
	}
}
