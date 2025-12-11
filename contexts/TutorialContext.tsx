"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { Tutorial, TutorialStep, TutorialContextValue, TutorialState } from "@/types/tutorial"

const TUTORIAL_STORAGE_KEY = "agenthub-tutorials"

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
export function TutorialProvider({ children, tutorials = [] }: TutorialProviderProps) {
	const [tutorialState, setTutorialState] = useState<TutorialState>(loadTutorialState)
	const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null)
	const [currentStepIndex, setCurrentStepIndex] = useState(0)

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

	// Auto-start tutorials on first visit
	useEffect(() => {
		if (tutorials.length === 0) return

		// Find the first tutorial that should auto-start and hasn't been completed
		const autoStartTutorial = tutorials.find(
			t => t.autoStart && !tutorialState.completed[t.id]
		)

		if (autoStartTutorial && !activeTutorialId) {
			// Small delay to let the page render first
			const timer = setTimeout(() => {
				setActiveTutorialId(autoStartTutorial.id)
				setCurrentStepIndex(tutorialState.progress[autoStartTutorial.id] || 0)
			}, 500)

			return () => clearTimeout(timer)
		}
	}, [tutorials, tutorialState.completed, activeTutorialId, tutorialState.progress])

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
	const skipTutorial = useCallback(() => {
		setActiveTutorialId(null)
		setCurrentStepIndex(0)
	}, [])

	/**
	 * Complete the current tutorial
	 */
	const completeTutorial = useCallback(() => {
		if (!activeTutorialId) return

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
	}, [activeTutorialId, tutorialState])

	/**
	 * Check if a specific tutorial has been completed
	 */
	const isTutorialCompleted = useCallback((tutorialId: string): boolean => {
		return tutorialState.completed[tutorialId] || false
	}, [tutorialState.completed])

	/**
	 * Reset all tutorials
	 */
	const resetAllTutorials = useCallback(() => {
		const newState: TutorialState = {
			completed: {},
			progress: {},
			lastUpdated: new Date().toISOString(),
		}
		setTutorialState(newState)
		saveTutorialState(newState)
		setActiveTutorialId(null)
		setCurrentStepIndex(0)
	}, [])

	/**
	 * Reset a specific tutorial
	 */
	const resetTutorial = useCallback((tutorialId: string) => {
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
	}, [tutorialState, activeTutorialId])

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
