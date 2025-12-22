import { NextRequest, NextResponse } from "next/server"
import { serialize } from "next-mdx-remote/serialize"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"

export async function POST(request: NextRequest) {
	try {
		const { content } = await request.json()

		if (!content || typeof content !== "string") {
			return NextResponse.json(
				{ error: "Content is required and must be a string" },
				{ status: 400 }
			)
		}

		const serialized = await serialize(content, {
			mdxOptions: {
				remarkPlugins: [remarkGfm, remarkFrontmatter],
				rehypePlugins: [],
			},
		})

		return NextResponse.json({ serialized })
	} catch (error) {
		console.error("Error serializing MDX:", error)
		return NextResponse.json(
			{ error: "Failed to serialize MDX content" },
			{ status: 500 }
		)
	}
}
