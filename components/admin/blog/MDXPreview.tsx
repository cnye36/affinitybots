"use client"

import { useEffect, useState } from "react"
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote"
import { components } from "@/components/blog/MDXComponents"

interface MDXPreviewProps {
	content: string
}

export function MDXPreview({ content }: MDXPreviewProps) {
	const [serializedContent, setSerializedContent] = useState<MDXRemoteSerializeResult | null>(null)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		if (!content) {
			setSerializedContent(null)
			return
		}

		const serializeMDX = async () => {
			setLoading(true)
			setError(null)

			try {
				const response = await fetch("/api/admin/blog/preview-mdx", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ content }),
				})

				if (!response.ok) {
					throw new Error("Failed to serialize MDX")
				}

				const data = await response.json()
				setSerializedContent(data.serialized)
			} catch (err) {
				console.error("Error serializing MDX:", err)
				setError("Failed to render preview")
			} finally {
				setLoading(false)
			}
		}

		// Debounce serialization to avoid too many requests
		const timeoutId = setTimeout(() => {
			serializeMDX()
		}, 500)

		return () => clearTimeout(timeoutId)
	}, [content])

	if (!content) {
		return <p className="text-muted-foreground">No content to preview</p>
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-[200px]">
				<div className="text-muted-foreground">Rendering preview...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="text-red-400 p-4 border border-red-400 rounded">
				Error: {error}
			</div>
		)
	}

	if (!serializedContent) {
		return null
	}

	return <MDXRemote {...serializedContent} components={components} />
}
