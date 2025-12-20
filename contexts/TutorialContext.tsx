"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Tutorial, TutorialStep, TutorialContextValue, TutorialState } from "@/types/tutorial"
import { createBrowserClient } from "@supabase/ssr"

const TUTORIAL_STORAGE_KEY = "agenthub-tutorials"
const DAYS_TO_CONSIDER_NEW_USER = 7

/**
 * Tutorial context - provides tutorial state and actions throughout the app
 */
const TutorialContext = createContext<TutorialContextValue | null>(null)

interface TutorialProviderProps {
	children: React.ReactNode
	/**
	 * Tutorials available on the current page
	 */
	tutorials?: Tutorial[]
	/**
	 * User creation date - if provided, will determine if user is "new"
	 */
	userCreatedAt?: string | null
}

/**
 * Load tutorial state from localStorage
 */
function loadTutorialState(): TutorialState {
	if (typeof window === "undefined") {
		return {
			completed: {},
			progress: {},
			lastUpdated: new Date().toISOString(),
		}
	}

	try {
		const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY)
		if (stored) {
			return JSON.parse(stored)
		}
	} catch (error) {
		console.error("Failed to load tutorial state:", error)
	}

	return {
		completed: {},
		progress: {},
		lastUpdated: new Date().toISOString(),
	}
}

/**
 * Save tutorial state to localStorage
 */
function saveTutorialState(state: TutorialState): void {
	if (typeof window === "undefined") return

	try {
		localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify({
			...state,
			lastUpdated: new Date().toISOString(),
		}))
	} catch (error) {
		console.error("Failed to save tutorial state:", error)
	}
}

/**
 * Tutorial Provider Component
 * Manages tutorial state and provides tutorial controls
 */
export function TutorialProvider({ children, tutorials = [], userCreatedAt = null }: TutorialProviderProps) {
	const [tutorialState, setTutorialState] = useState<TutorialState>(loadTutorialState)
	const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null)
	const [currentStepIndex, setCurrentStepIndex] = useState(0)
	const hasAutoStartedRef = useRef(false)
	const [isLoadingFromDB, setIsLoadingFromDB] = useState(true)
	const supabase = createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)

	/**
	 * Check if user is considered "new" based on their account creation date
	 */
	const isNewUser = useMemo(() => {
		if (!userCreatedAt) return false
		const createdDate = new Date(userCreatedAt)
		const daysSinceCreation = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
		return daysSinceCreation <= DAYS_TO_CONSIDER_NEW_USER
	}, [userCreatedAt])

	/**
	 * Load tutorial completion state from database
	 */
	useEffect(() => {
		async function loadFromDatabase() {
			try {
				const { data: { user } } = await supabase.auth.getUser()
				if (!user) {
					setIsLoadingFromDB(false)
					return
				}

				// Fetch completed tutorials from database
				const { data: completions, error } = await supabase
					.from("user_tutorial_completion")
					.select("tutorial_id")
					.eq("user_id", user.id)

				if (error) {
					console.error("Failed to load tutorial completions from database:", error)
					setIsLoadingFromDB(false)
					return
				}

				// Build completed state from database
				const completedFromDB: Record<string, boolean> = {}
				completions?.forEach((completion: any) => {
					completedFromDB[completion.tutorial_id] = true
				})

				// Migrate localStorage data to database if needed
				const localState = loadTutorialState()
				const localCompletedTutorials = Object.entries(localState.completed || {})
					.filter(([_, completed]) => completed)
					.map(([tutorialId]) => tutorialId)

				// Insert any completed tutorials from localStorage that aren't in the database
				for (const tutorialId of localCompletedTutorials) {
					if (!completedFromDB[tutorialId]) {
						await supabase
							.from("user_tutorial_completion")
							.insert({
								user_id: user.id,
								tutorial_id: tutorialId,
							})
							.select()
						completedFromDB[tutorialId] = true
					}
				}

				// Update state with database data
				setTutorialState(prev => ({
					...prev,
					completed: completedFromDB,
				}))
			} catch (error) {
				console.error("Error loading tutorial state from database:", error)
			} finally {
				setIsLoadingFromDB(false)
			}
		}

		loadFromDatabase()
	}, [supabase])

	// Get the current active tutorial
	const currentTutorial = useMemo(() => {
		if (!activeTutorialId) return null
		return tutorials.find(t => t.id === activeTutorialId) || null
	}, [activeTutorialId, tutorials])

	// Get the current step
	const currentStep = useMemo(() => {
		if (!currentTutorial) return null
		return currentTutorial.steps[currentStepIndex] || null
	}, [currentTutorial, currentStepIndex])

	// Auto-start tutorials on first visit (only for new users)
	useEffect(() => {
		if (tutorials.length === 0) return
		if (hasAutoStartedRef.current) return // Prevent auto-starting multiple times in the same session
		if (isLoadingFromDB) return // Wait for database to load
		if (!isNewUser) return // Only auto-start for new users

		// Find the first tutorial that should auto-start and hasn't been completed
		const autoStartTutorial = tutorials.find(
			t => t.autoStart && !tutorialState.completed[t.id]
		)

		if (autoStartTutorial && !activeTutorialId) {
			// Small delay to let the page render first
			const timer = setTimeout(() => {
				setActiveTutorialId(autoStartTutorial.id)
				setCurrentStepIndex(tutorialState.progress[autoStartTutorial.id] || 0)
				hasAutoStartedRef.current = true // Mark that we've auto-started
			}, 500)

			return () => clearTimeout(timer)
		}
	}, [tutorials, tutorialState.completed, activeTutorialId, tutorialState.progress, isLoadingFromDB, isNewUser])

	// Execute beforeShow action when step changes
	useEffect(() => {
		if (currentStep?.beforeShow) {
			Promise.resolve(currentStep.beforeShow()).catch(err => {
				console.error("Tutorial beforeShow action failed:", err)
			})
		}
	}, [currentStep])

	/**
	 * Start a specific tutorial
	 */
	const startTutorial = useCallback((tutorialId: string) => {
		const tutorial = tutorials.find(t => t.id === tutorialId)
		if (!tutorial) {
			console.warn(`Tutorial "${tutorialId}" not found`)
			return
		}

		setActiveTutorialId(tutorialId)
		setCurrentStepIndex(tutorialState.progress[tutorialId] || 0)
	}, [tutorials, tutorialState.progress])

	/**
	 * Move to the next step
	 */
	const nextStep = useCallback(async () => {
		if (!currentTutorial || !currentStep) return

		// Execute afterComplete action
		if (currentStep.afterComplete) {
			try {
				await Promise.resolve(currentStep.afterComplete())
			} catch (err) {
				console.error("Tutorial afterComplete action failed:", err)
			}
		}

		const nextIndex = currentStepIndex + 1

		// Check if we've reached the end
		if (nextIndex >= currentTutorial.steps.length) {
			completeTutorial()
			return
		}

		setCurrentStepIndex(nextIndex)

		// Save progress
		const newState = {
			...tutorialState,
			progress: {
				...tutorialState.progress,
				[currentTutorial.id]: nextIndex,
			},
		}
		setTutorialState(newState)
		saveTutorialState(newState)
	}, [currentTutorial, currentStep, currentStepIndex, tutorialState])

	/**
	 * Move to the previous step
	 */
	const previousStep = useCallback(() => {
		if (currentStepIndex === 0) return

		const prevIndex = currentStepIndex - 1
		setCurrentStepIndex(prevIndex)

		// Save progress
		if (currentTutorial) {
			const newState = {
				...tutorialState,
				progress: {
					...tutorialState.progress,
					[currentTutorial.id]: prevIndex,
				},
			}
			setTutorialState(newState)
			saveTutorialState(newState)
		}
	}, [currentStepIndex, currentTutorial, tutorialState])

	/**
	 * Skip/close the current tutorial
	 */
	const skipTutorial = useCallback(async () => {
		if (!activeTutorialId) return

		// Mark tutorial as completed in database
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				await supabase
					.from("user_tutorial_completion")
					.insert({
						user_id: user.id,
						tutorial_id: activeTutorialId,
					})
					.select()
			}
		} catch (error) {
			console.error("Failed to save tutorial completion to database:", error)
		}

		// Mark tutorial as completed so it doesn't auto-start again
		const newState = {
			...tutorialState,
			completed: {
				...tutorialState.completed,
				[activeTutorialId]: true,
			},
			progress: {
				...tutorialState.progress,
				[activeTutorialId]: 0,
			},
		}

		setTutorialState(newState)
		saveTutorialState(newState)
		setActiveTutorialId(null)
		setCurrentStepIndex(0)
	}, [activeTutorialId, tutorialState, supabase])

	/**
	 * Complete the current tutorial
	 */
	const completeTutorial = useCallback(async () => {
		if (!activeTutorialId) return

		// Mark tutorial as completed in database
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				await supabase
					.from("user_tutorial_completion")
					.insert({
						user_id: user.id,
						tutorial_id: activeTutorialId,
					})
					.select()
			}
		} catch (error) {
			console.error("Failed to save tutorial completion to database:", error)
		}

		const newState = {
			...tutorialState,
			completed: {
				...tutorialState.completed,
				[activeTutorialId]: true,
			},
			progress: {
				...tutorialState.progress,
				[activeTutorialId]: 0,
			},
		}

		setTutorialState(newState)
		saveTutorialState(newState)
		setActiveTutorialId(null)
		setCurrentStepIndex(0)
	}, [activeTutorialId, tutorialState, supabase])

	/**
	 * Check if a specific tutorial has been completed
	 */
	const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
		return tutorialState.completed[tutorialId] || false
	}, [tutorialState.completed])

	/**
	 * Reset all tutorials
	 */
	const resetAllTutorials = useCallback(async () => {
		// Delete all tutorial completions from database
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				await supabase
					.from("user_tutorial_completion")
					.delete()
					.eq("user_id", user.id)
			}
		} catch (error) {
			console.error("Failed to reset tutorials in database:", error)
		}

		const newState: TutorialState = {
			completed: {},
			progress: {},
			lastUpdated: new Date().toISOString(),
		}
		setTutorialState(newState)
		saveTutorialState(newState)
		setActiveTutorialId(null)
		setCurrentStepIndex(0)
	}, [supabase])

	/**
	 * Reset a specific tutorial
	 */
	const resetTutorial = useCallback(async (tutorialId: string) => {
		// Delete specific tutorial completion from database
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				await supabase
					.from("user_tutorial_completion")
					.delete()
					.eq("user_id", user.id)
					.eq("tutorial_id", tutorialId)
			}
		} catch (error) {
			console.error("Failed to reset tutorial in database:", error)
		}

		const newState = {
			...tutorialState,
			completed: {
				...tutorialState.completed,
				[tutorialId]: false,
			},
			progress: {
				...tutorialState.progress,
				[tutorialId]: 0,
			},
		}
		setTutorialState(newState)
		saveTutorialState(newState)

		// If this is the active tutorial, reset it
		if (activeTutorialId === tutorialId) {
			setCurrentStepIndex(0)
		}
	}, [tutorialState, activeTutorialId, supabase])

	/**
	 * Get the current tutorial configuration
	 */
	const getCurrentTutorial = useCallback((): Tutorial | null => {
		return currentTutorial
	}, [currentTutorial])

	/**
	 * Get the current step configuration
	 */
	const getCurrentStep = useCallback((): TutorialStep | null => {
		return currentStep
	}, [currentStep])

	const value: TutorialContextValue = {
		activeTutorialId,
		currentStepIndex,
		isActive: activeTutorialId !== null,
		hasTutorial: tutorials.length > 0,
		startTutorial,
		nextStep,
		previousStep,
		skipTutorial,
		completeTutorial,
		isTutorialCompleted,
		resetAllTutorials,
		resetTutorial,
		getCurrentTutorial,
		getCurrentStep,
	}

	return (
		<TutorialContext.Provider value={value}>
			{children}
		</TutorialContext.Provider>
	)
}

/**
 * Hook to access tutorial context
 * Must be used within a TutorialProvider
 */
export function useTutorial(): TutorialContextValue {
	const context = useContext(TutorialContext)
	if (!context) {
		throw new Error("useTutorial must be used within a TutorialProvider")
	}
	return context
}
