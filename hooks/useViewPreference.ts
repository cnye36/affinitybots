"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/supabase/client"

type ViewMode = "grid" | "list"
type SectionName = "agents" | "workflows" | "tools"

export function useViewPreference(section: SectionName, defaultValue: ViewMode = "grid") {
	const [viewMode, setViewModeState] = useState<ViewMode>(defaultValue)
	const [isLoading, setIsLoading] = useState(true)
	const sectionRef = useRef(section)
	const defaultValueRef = useRef(defaultValue)
	const hasLoadedRef = useRef(false)

	// Keep refs in sync
	useEffect(() => {
		sectionRef.current = section
		defaultValueRef.current = defaultValue
	}, [section, defaultValue])

	// Load preference from database (only once on mount)
	useEffect(() => {
		if (hasLoadedRef.current) return

		async function loadPreference() {
			hasLoadedRef.current = true
			try {
				const supabase = createClient()
				const {
					data: { user },
				} = await supabase.auth.getUser()
				if (!user) {
					setViewModeState(defaultValueRef.current)
					setIsLoading(false)
					return
				}

				const { data: profile } = await supabase
					.from("profiles")
					.select("preferences")
					.eq("id", user.id)
					.single()

				const preferences = (profile?.preferences as Record<string, any>) || {}
				const viewPreferences = preferences.viewMode || {}
				const savedMode = viewPreferences[sectionRef.current] as ViewMode | undefined

				if (savedMode === "grid" || savedMode === "list") {
					setViewModeState(savedMode)
				} else {
					setViewModeState(defaultValueRef.current)
				}
			} catch (error) {
				console.error(`Error loading view preference for ${sectionRef.current}:`, error)
				setViewModeState(defaultValueRef.current)
			} finally {
				setIsLoading(false)
			}
		}

		loadPreference()
	}, [])

	// Save preference to database
	const setViewMode = useCallback(async (mode: ViewMode) => {
		// Optimistically update the UI immediately - this should stick
		setViewModeState(mode)

		// Save to database in the background (fire and forget)
		try {
			const supabase = createClient()
			const {
				data: { user },
			} = await supabase.auth.getUser()
			if (!user) return

			// Get current preferences
			const { data: profile } = await supabase
				.from("profiles")
				.select("preferences")
				.eq("id", user.id)
				.single()

			const currentPreferences = (profile?.preferences as Record<string, any>) || {}
			const currentViewMode = currentPreferences.viewMode || {}

			// Update the specific section's view mode
			const updatedViewMode = {
				...currentViewMode,
				[sectionRef.current]: mode,
			}

			// Update preferences
			const updatedPreferences = {
				...currentPreferences,
				viewMode: updatedViewMode,
			}

			const { error } = await supabase
				.from("profiles")
				.update({ preferences: updatedPreferences })
				.eq("id", user.id)

			if (error) {
				console.error(`Error saving view preference for ${sectionRef.current}:`, error)
				// Don't revert on error - keep the optimistic update
			}
		} catch (error) {
			console.error(`Error saving view preference for ${sectionRef.current}:`, error)
			// Don't revert on error - keep the optimistic update
		}
	}, [])

	return { viewMode, setViewMode, isLoading }
}

