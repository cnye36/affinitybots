/**
 * Enhanced Memory System Types
 *
 * Type definitions for the intent-based, rich-context memory system
 */

export type MemoryCategory =
	| "personal_info"    // Name, age, location, family
	| "preferences"      // Likes, dislikes, communication style
	| "work"            // Job, company, projects, colleagues
	| "goals"           // Objectives, aspirations, targets
	| "relationships"   // Connections, team members, contacts
	| "context"         // Background, history, important context
	| "other"           // Miscellaneous information

export type MemoryImportance = "critical" | "high" | "medium" | "low"

export type IntentConfidence = "high" | "medium" | "low"

/**
 * Core memory structure stored in Langgraph KV store
 */
export interface EnhancedMemory {
	// Identification
	title: string                     // Brief, human-readable title (max 60 chars)
	category: MemoryCategory          // Categorization for organization

	// Semantic content
	content: string                   // Full semantic description (1-3 sentences)
	key_facts: Array<{               // Structured attribute-value pairs
		attribute: string
		value: unknown
		confidence?: number           // Optional: extraction confidence
	}>

	// Importance and context
	importance: MemoryImportance      // Priority level
	context: string                   // Why this matters / how it relates

	// Metadata
	extracted_at: string              // ISO timestamp
	updated_at?: string               // For updates to existing memories
	source_message: string            // Original user message
	intent_confidence: IntentConfidence // How sure we are user wanted this remembered

	// Future enhancements
	tags?: string[]                   // User-added or auto-generated tags
	related_to?: string[]             // IDs of related memories
}

/**
 * Intent detection result
 */
export interface MemoryIntent {
	should_remember: boolean          // Whether to extract memory
	intent_confidence: IntentConfidence // How confident we are
	trigger_phrase: string            // The phrase that triggered detection
	reason: string                    // Brief explanation
}

/**
 * Memory extraction result
 */
export interface MemoryExtraction {
	title: string
	category: MemoryCategory
	content: string
	key_facts: Array<{
		attribute: string
		value: unknown
	}>
	importance: MemoryImportance
	context: string
}

/**
 * Display format for UI (after retrieval from store)
 */
export interface DisplayMemory extends EnhancedMemory {
	id: string                        // Store key (mem_{timestamp}_{uuid})
	created_at?: string               // From store metadata
}

/**
 * Category metadata for UI display
 */
export interface CategoryInfo {
	id: MemoryCategory
	label: string
	description: string
	icon: string                      // Lucide icon name
	color: string                     // Tailwind color class
}

/**
 * Memory sorting options
 */
export type MemorySortBy = "importance" | "date" | "category" | "title"

/**
 * Memory filter options
 */
export interface MemoryFilters {
	category?: MemoryCategory[]
	importance?: MemoryImportance[]
	search?: string
	dateRange?: {
		start: Date
		end: Date
	}
}
