"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { DisplayMemory, MemoryCategory, MemorySortBy } from "@/types/memory"
import { MemoryCard } from "@/components/memories/MemoryCard"
import { CATEGORY_INFO, groupByCategory, sortMemories } from "@/lib/memory/formatting"
import { useAgent } from "@/hooks/useAgent"
import type { Assistant } from "@/types/assistant"

export default function MemoriesPage() {
	const { id } = useParams()
	const [memories, setMemories] = useState<DisplayMemory[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedCategory, setSelectedCategory] = useState<MemoryCategory | "all">("all")
	const [sortBy, setSortBy] = useState<MemorySortBy>("importance")
	const [searchQuery, setSearchQuery] = useState("")
	
	// Fetch agent data
	const { assistant, isLoading: agentLoading } = useAgent(id as string)

	useEffect(() => {
		async function fetchMemories() {
			try {
				setLoading(true)
				const response = await fetch(`/api/agents/${id}/memories`)

				if (!response.ok) {
					throw new Error(`Failed to fetch memories: ${response.statusText}`)
				}

				const data = await response.json()
				setMemories(data)
			} catch (err) {
				console.error("Error fetching memories:", err)
				setError(
					err instanceof Error ? err.message : "Failed to load memories"
				)
			} finally {
				setLoading(false)
			}
		}

		if (id) {
			fetchMemories()
		}
	}, [id])

	const handleDeleteMemory = async (memoryId: string) => {
		try {
			const response = await fetch(`/api/agents/${id}/memories/${memoryId}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				throw new Error(`Failed to delete memory: ${response.statusText}`)
			}

			// Remove the deleted memory from the state
			setMemories(memories.filter((memory) => memory.id !== memoryId))
		} catch (err) {
			console.error("Error deleting memory:", err)
			setError(err instanceof Error ? err.message : "Failed to delete memory")
		}
	}

	// Filter and sort memories
	const filteredMemories = memories.filter((memory) => {
		// Category filter
		if (selectedCategory !== "all" && memory.category !== selectedCategory) {
			return false
		}

		// Search filter
		if (searchQuery) {
			const query = searchQuery.toLowerCase()
			return (
				memory.title.toLowerCase().includes(query) ||
				memory.content.toLowerCase().includes(query) ||
				memory.key_facts.some((fact) =>
					String(fact.value).toLowerCase().includes(query)
				)
			)
		}

		return true
	})

	// Apply sorting
	const sortedMemories = (() => {
		switch (sortBy) {
			case "importance":
				return sortMemories(filteredMemories)
			case "date":
				return [...filteredMemories].sort(
					(a, b) =>
						new Date(b.extracted_at).getTime() -
						new Date(a.extracted_at).getTime()
				)
			case "category":
				return [...filteredMemories].sort((a, b) =>
					a.category.localeCompare(b.category)
				)
			case "title":
				return [...filteredMemories].sort((a, b) =>
					a.title.localeCompare(b.title)
				)
			default:
				return filteredMemories
		}
	})()

	// Group by category for stats
	const categoryCounts = groupByCategory(memories)
	const categoryStats = Object.entries(categoryCounts).map(([cat, mems]) => ({
		category: cat as MemoryCategory,
		count: mems.length,
	}))

	// Get agent info for display
	const avatarUrl = assistant?.metadata?.agent_avatar
	const avatarFallback = assistant?.name?.charAt(0).toUpperCase() || "A"

	return (
		<div className="container py-8 max-w-6xl">
			<div className="flex items-center mb-6 gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href={`/agents/${id}`}>
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				{assistant && (
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 border-2 border-border">
							{avatarUrl ? (
								<AvatarImage src={avatarUrl} alt={assistant.name} />
							) : (
								<AvatarFallback
									className="bg-gradient-to-br from-violet-500 to-purple-500 text-white font-semibold"
									style={{
										backgroundColor: `hsl(${
											(assistant.name.length * 30) % 360
										}, 70%, 50%)`,
									}}
								>
									{avatarFallback}
								</AvatarFallback>
							)}
						</Avatar>
						<h1 className="text-2xl font-bold">
							{assistant.name} Memories
						</h1>
					</div>
				)}
				{!assistant && !agentLoading && (
					<h1 className="text-2xl font-bold">Agent Memories</h1>
				)}
			</div>

			{error && (
				<Alert variant="destructive" className="mb-6">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Error</AlertTitle>
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{loading ? (
				<div className="flex justify-center my-12">
					<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
				</div>
			) : memories.length === 0 ? (
				<div className="border border-dashed rounded-lg p-12 text-center">
					<p className="text-muted-foreground mb-2">
						No memories have been stored yet.
					</p>
					<p className="text-sm text-muted-foreground">
						The agent will remember information when you explicitly ask it to using phrases like "Remember that..." or "Keep in mind..."
					</p>
				</div>
			) : (
				<>
					{/* Statistics */}
					<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
						{Object.entries(CATEGORY_INFO).map(([cat, info]) => {
							const count = categoryCounts[cat as MemoryCategory]?.length || 0
							return (
								<div
									key={cat}
									className="border rounded-lg p-3 flex flex-col items-center justify-center gap-1"
								>
									<span className="text-2xl font-bold">{count}</span>
									<span className="text-xs text-muted-foreground text-center">
										{info.label}
									</span>
								</div>
							)
						})}
					</div>

					{/* Filters and Search */}
					<div className="flex flex-col md:flex-row gap-3 mb-6">
						{/* Search */}
						<div className="flex-1 relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search memories..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-9"
							/>
						</div>

						{/* Sort */}
						<Select value={sortBy} onValueChange={(v) => setSortBy(v as MemorySortBy)}>
							<SelectTrigger className="w-full md:w-[180px]">
								<SelectValue placeholder="Sort by" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="importance">Importance</SelectItem>
								<SelectItem value="date">Date</SelectItem>
								<SelectItem value="category">Category</SelectItem>
								<SelectItem value="title">Title</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Category Tabs */}
					<Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as MemoryCategory | "all")}>
						<TabsList className="mb-6 flex-wrap h-auto">
							<TabsTrigger value="all">
								All ({memories.length})
							</TabsTrigger>
							{Object.entries(CATEGORY_INFO).map(([cat, info]) => {
								const count = categoryCounts[cat as MemoryCategory]?.length || 0
								if (count === 0) return null
								return (
									<TabsTrigger key={cat} value={cat}>
										{info.label} ({count})
									</TabsTrigger>
								)
							})}
						</TabsList>

						<TabsContent value={selectedCategory} className="space-y-4 mt-0">
							{sortedMemories.length === 0 ? (
								<div className="border border-dashed rounded-lg p-8 text-center">
									<p className="text-muted-foreground">
										No memories found matching your filters.
									</p>
								</div>
							) : (
								sortedMemories.map((memory) => (
									<MemoryCard
										key={memory.id}
										memory={memory}
										onDelete={handleDeleteMemory}
									/>
								))
							)}
						</TabsContent>
					</Tabs>
				</>
			)}
		</div>
	)
}
