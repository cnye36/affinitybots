"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface AgentConfigPanelContextType {
	isOpen: boolean
	openPanel: () => void
	closePanel: () => void
	togglePanel: () => void
}

const AgentConfigPanelContext = createContext<AgentConfigPanelContextType | undefined>(undefined)

const STORAGE_KEY = "agent-config-panel-state"

/**
 * Determines if the config panel should be open by default based on viewport
 * @returns true for desktop (>=1024px), false for mobile/tablet
 */
function getDefaultPanelState(): boolean {
	if (typeof window === "undefined") return true // SSR default
	const isMobile = window.innerWidth < 1024 // lg breakpoint
	return !isMobile
}

/**
 * Provides context for managing the agent configuration panel state
 * Persists state to localStorage and respects viewport size defaults
 */
export function AgentConfigPanelProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(() => {
		if (typeof window === "undefined") return true

		// Try to restore from localStorage
		const stored = localStorage.getItem(STORAGE_KEY)
		if (stored !== null) {
			return stored === "true"
		}

		// No stored preference, use viewport default
		return getDefaultPanelState()
	})

	// Persist to localStorage when state changes
	useEffect(() => {
		localStorage.setItem(STORAGE_KEY, String(isOpen))
	}, [isOpen])

	const openPanel = () => setIsOpen(true)
	const closePanel = () => setIsOpen(false)
	const togglePanel = () => setIsOpen((prev) => !prev)

	return (
		<AgentConfigPanelContext.Provider
			value={{
				isOpen,
				openPanel,
				closePanel,
				togglePanel,
			}}
		>
			{children}
		</AgentConfigPanelContext.Provider>
	)
}

/**
 * Hook to access agent configuration panel state and controls
 * @throws Error if used outside of AgentConfigPanelProvider
 */
export function useAgentConfigPanel() {
	const context = useContext(AgentConfigPanelContext)
	if (!context) {
		throw new Error("useAgentConfigPanel must be used within AgentConfigPanelProvider")
	}
	return context
}
