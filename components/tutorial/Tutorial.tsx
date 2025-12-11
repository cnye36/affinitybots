"use client"

import React from "react"
import { useTutorial } from "@/contexts/TutorialContext"
import { TutorialTooltip } from "./TutorialTooltip"
import { TutorialSpotlight } from "./TutorialSpotlight"

/**
 * Tutorial Component
 * Renders the active tutorial's tooltip and spotlight
 */
export function Tutorial() {
	const {
		isActive,
		currentStepIndex,
		getCurrentTutorial,
		getCurrentStep,
		nextStep,
		previousStep,
		skipTutorial,
	} = useTutorial()

	const currentTutorial = getCurrentTutorial()
	const currentStep = getCurrentStep()

	// Don't render anything if no tutorial is active
	if (!isActive || !currentTutorial || !currentStep) {
		return null
	}

	const canGoBack = currentStepIndex > 0
	const showSpotlight = currentStep.showSpotlight !== false // Default to true

	return (
		<>
			{/* Spotlight backdrop and highlight */}
			{showSpotlight && (
				<TutorialSpotlight
					target={currentStep.target}
					active={isActive}
					onBackdropClick={skipTutorial}
				/>
			)}

			{/* Tutorial tooltip with content and navigation */}
			<TutorialTooltip
				step={currentStep}
				currentStep={currentStepIndex + 1} // Convert to 1-indexed for display
				totalSteps={currentTutorial.steps.length}
				onNext={nextStep}
				onBack={previousStep}
				onSkip={skipTutorial}
				canGoBack={canGoBack}
			/>
		</>
	)
}
