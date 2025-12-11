/**
 * Tutorial system types
 * Defines the structure for onboarding tutorials across the application
 */

/**
 * Position of the tutorial tooltip relative to the target element
 */
export type TutorialPosition = "top" | "bottom" | "left" | "right"

/**
 * Individual tutorial step configuration
 */
export interface TutorialStep {
	/**
	 * Unique identifier for this step
	 */
	id: string

	/**
	 * CSS selector or element ID to highlight and attach tooltip to
	 */
	target: string

	/**
	 * Title of the tutorial step
	 */
	title: string

	/**
	 * Detailed description/content for this step
	 */
	content: string

	/**
	 * Preferred position of the tooltip (defaults to "bottom")
	 */
	position?: TutorialPosition

	/**
	 * Whether to show a visual spotlight/highlight on the target element
	 */
	showSpotlight?: boolean

	/**
	 * Optional action to perform before showing this step
	 */
	beforeShow?: () => void | Promise<void>

	/**
	 * Optional action to perform after completing this step
	 */
	afterComplete?: () => void | Promise<void>
}

/**
 * Complete tutorial configuration for a page or feature
 */
export interface Tutorial {
	/**
	 * Unique identifier for this tutorial (e.g., "dashboard", "agents-list")
	 */
	id: string

	/**
	 * Display name of the tutorial
	 */
	name: string

	/**
	 * Brief description of what this tutorial covers
	 */
	description: string

	/**
	 * Array of tutorial steps in order
	 */
	steps: TutorialStep[]

	/**
	 * Whether this tutorial should auto-start on first visit
	 */
	autoStart?: boolean
}

/**
 * Tutorial completion state stored in localStorage
 */
export interface TutorialState {
	/**
	 * Map of tutorial ID to completion status
	 */
	completed: Record<string, boolean>

	/**
	 * Map of tutorial ID to last completed step index
	 */
	progress: Record<string, number>

	/**
	 * Timestamp of last update
	 */
	lastUpdated: string
}

/**
 * Tutorial context value
 */
export interface TutorialContextValue {
	/**
	 * Currently active tutorial ID, or null if none active
	 */
	activeTutorialId: string | null

	/**
	 * Current step index in the active tutorial
	 */
	currentStepIndex: number

	/**
	 * Whether the tutorial is currently running
	 */
	isActive: boolean

	/**
	 * Whether tutorials are available for the current page
	 */
	hasTutorial: boolean

	/**
	 * Start a specific tutorial
	 */
	startTutorial: (tutorialId: string) => void

	/**
	 * Move to the next step
	 */
	nextStep: () => void

	/**
	 * Move to the previous step
	 */
	previousStep: () => void

	/**
	 * Skip/close the current tutorial
	 */
	skipTutorial: () => void

	/**
	 * Complete the current tutorial
	 */
	completeTutorial: () => void

	/**
	 * Check if a specific tutorial has been completed
	 */
	isTutorialCompleted: (tutorialId: string) => boolean

	/**
	 * Reset all tutorials (for testing or user preference)
	 */
	resetAllTutorials: () => void

	/**
	 * Reset a specific tutorial
	 */
	resetTutorial: (tutorialId: string) => void

	/**
	 * Get the current tutorial configuration
	 */
	getCurrentTutorial: () => Tutorial | null

	/**
	 * Get the current step configuration
	 */
	getCurrentStep: () => TutorialStep | null
}
