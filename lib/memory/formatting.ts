/**
 * Utility functions for memory formatting, categorization, and smart limiting
 */

import type {
	EnhancedMemory,
	DisplayMemory,
	MemoryCategory,
	MemoryImportance,
	CategoryInfo,
} from "@/types/memory"

/**
 * Category metadata for UI display
 */
export const CATEGORY_INFO: Record<MemoryCategory, CategoryInfo> = {
	personal_info: {
		id: "personal_info",
		label: "Personal Info",
		description: "Name, location, and personal details",
		icon: "User",
		color: "blue",
	},
	preferences: {
		id: "preferences",
		label: "Preferences",
		description: "Likes, dislikes, and communication style",
		icon: "Heart",
		color: "pink",
	},
	work: {
		id: "work",
		label: "Work",
		description: "Job, company, and projects",
		icon: "Briefcase",
		color: "violet",
	},
	goals: {
		id: "goals",
		label: "Goals",
		description: "Objectives and aspirations",
		icon: "Target",
		color: "green",
	},
	relationships: {
		id: "relationships",
		label: "Relationships",
		description: "Team members and contacts",
		icon: "Users",
		color: "cyan",
	},
	context: {
		id: "context",
		label: "Context",
		description: "Background and history",
		icon: "FileText",
		color: "amber",
	},
	other: {
		id: "other",
		label: "Other",
		description: "Miscellaneous information",
		icon: "MoreHorizontal",
		color: "gray",
	},
}

/**
 * Importance ordering (highest to lowest)
 */
const IMPORTANCE_ORDER: MemoryImportance[] = ["critical", "high", "medium", "low"]

/**
 * Smart memory limiting - select top N memories by importance and recency
 */
export function selectTopMemories(
	memories: DisplayMemory[],
	limit: number = 20
): DisplayMemory[] {
	if (memories.length <= limit) {
		return memories
	}

	// Sort by importance first, then by recency within same importance
	const sorted = [...memories].sort((a, b) => {
		const importanceA = IMPORTANCE_ORDER.indexOf(a.importance)
		const importanceB = IMPORTANCE_ORDER.indexOf(b.importance)

		// Compare by importance first
		if (importanceA !== importanceB) {
			return importanceA - importanceB
		}

		// If same importance, prefer more recent
		const dateA = new Date(a.extracted_at).getTime()
		const dateB = new Date(b.extracted_at).getTime()
		return dateB - dateA // Descending (newest first)
	})

	return sorted.slice(0, limit)
}

/**
 * Group memories by category
 */
export function groupByCategory(
	memories: DisplayMemory[]
): Record<MemoryCategory, DisplayMemory[]> {
	const grouped: Record<string, DisplayMemory[]> = {}

	for (const category of Object.keys(CATEGORY_INFO)) {
		grouped[category] = []
	}

	for (const memory of memories) {
		if (!grouped[memory.category]) {
			grouped[memory.category] = []
		}
		grouped[memory.category].push(memory)
	}

	return grouped as Record<MemoryCategory, DisplayMemory[]>
}

/**
 * Sort memories within a category by importance and recency
 */
export function sortMemories(memories: DisplayMemory[]): DisplayMemory[] {
	return [...memories].sort((a, b) => {
		const importanceA = IMPORTANCE_ORDER.indexOf(a.importance)
		const importanceB = IMPORTANCE_ORDER.indexOf(b.importance)

		if (importanceA !== importanceB) {
			return importanceA - importanceB
		}

		const dateA = new Date(a.extracted_at).getTime()
		const dateB = new Date(b.extracted_at).getTime()
		return dateB - dateA
	})
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: MemoryCategory): string {
	return CATEGORY_INFO[category]?.label || category
}

/**
 * Format memories for AI system prompt
 */
export function formatMemoriesForPrompt(memories: DisplayMemory[]): string {
	if (memories.length === 0) {
		return ""
	}

	// Apply smart limiting - top 20 memories
	const topMemories = selectTopMemories(memories, 20)

	let context = "\n\n=== USER PROFILE & CONTEXT ===\n"

	// Group by category
	const categorized = groupByCategory(topMemories)

	// Process each category
	for (const [category, categoryMemories] of Object.entries(categorized)) {
		if (categoryMemories.length === 0) continue

		const categoryInfo = CATEGORY_INFO[category as MemoryCategory]
		context += `\n## ${categoryInfo.label}\n`

		// Sort by importance within category
		const sorted = sortMemories(categoryMemories)

		for (const memory of sorted) {
			context += `\n### ${memory.title}\n`
			context += `${memory.content}\n`

			if (memory.context) {
				context += `_Context: ${memory.context}_\n`
			}

			// Include key facts as structured data
			if (memory.key_facts.length > 0) {
				const facts = memory.key_facts
					.map((f) => {
						const value =
							typeof f.value === "string"
								? f.value
								: JSON.stringify(f.value)
						return `${f.attribute}=${value}`
					})
					.join(", ")
				context += `Key facts: ${facts}\n`
			}
		}
	}

	context += "\n=== END PROFILE ===\n"
	return context
}

/**
 * Format a single key fact value for display
 */
export function formatFactValue(value: unknown): string {
	if (value === null || value === undefined) {
		return ""
	}

	if (typeof value === "string") {
		return value
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return String(value)
	}

	if (Array.isArray(value)) {
		return value.map((v) => formatFactValue(v)).join(", ")
	}

	if (typeof value === "object") {
		return JSON.stringify(value, null, 2)
	}

	return String(value)
}

/**
 * Calculate fact overlap between two memories (for deduplication)
 * Returns a value between 0 (no overlap) and 1 (complete overlap)
 */
export function calculateFactOverlap(
	factsA: EnhancedMemory["key_facts"],
	factsB: EnhancedMemory["key_facts"]
): number {
	if (factsA.length === 0 || factsB.length === 0) {
		return 0
	}

	// Create a set of attributes from B
	const attributesB = new Set(factsB.map((f) => f.attribute))

	// Count how many attributes from A are in B
	let matchingCount = 0
	for (const factA of factsA) {
		if (attributesB.has(factA.attribute)) {
			matchingCount++
		}
	}

	// Calculate overlap as percentage of the smaller set
	const minLength = Math.min(factsA.length, factsB.length)
	return matchingCount / minLength
}

/**
 * Find similar memories based on fact overlap
 * Returns the key of the most similar memory, or null if none found
 */
export async function findSimilarMemory(
	newMemory: EnhancedMemory,
	existingMemories: DisplayMemory[],
	overlapThreshold: number = 0.7
): Promise<string | null> {
	for (const existing of existingMemories) {
		const overlap = calculateFactOverlap(
			existing.key_facts,
			newMemory.key_facts
		)

		// If >70% overlap (or custom threshold), consider this a duplicate/update
		if (overlap >= overlapThreshold) {
			return existing.id
		}
	}

	return null
}

/**
 * Format importance level for display
 */
export function formatImportance(importance: MemoryImportance): {
	label: string
	color: string
	icon: string
} {
	const importanceMap: Record<
		MemoryImportance,
		{ label: string; color: string; icon: string }
	> = {
		critical: {
			label: "Critical",
			color: "red",
			icon: "AlertCircle",
		},
		high: {
			label: "High",
			color: "orange",
			icon: "ArrowUp",
		},
		medium: {
			label: "Medium",
			color: "yellow",
			icon: "Minus",
		},
		low: {
			label: "Low",
			color: "gray",
			icon: "ArrowDown",
		},
	}

	return importanceMap[importance]
}

/**
 * Format timestamp for display
 */
export function formatTimestamp(isoString: string): string {
	const date = new Date(isoString)
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffMins = Math.floor(diffMs / 60000)
	const diffHours = Math.floor(diffMs / 3600000)
	const diffDays = Math.floor(diffMs / 86400000)

	if (diffMins < 1) {
		return "Just now"
	} else if (diffMins < 60) {
		return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
	} else if (diffHours < 24) {
		return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
	} else if (diffDays < 7) {
		return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
	} else {
		return date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
		})
	}
}
