"use client"

import React, { createContext, useContext, useState } from "react"

interface AgentConfigSidebarContextType {
	isOpen: boolean
	openSidebar: () => void
	closeSidebar: () => void
	toggleSidebar: () => void
}

const AgentConfigSidebarContext = createContext<AgentConfigSidebarContextType | undefined>(undefined)

export function AgentConfigSidebarProvider({ children }: { children: React.ReactNode }) {
	const [isOpen, setIsOpen] = useState(false)

	const openSidebar = () => setIsOpen(true)
	const closeSidebar = () => setIsOpen(false)
	const toggleSidebar = () => setIsOpen((prev) => !prev)

	return (
		<AgentConfigSidebarContext.Provider
			value={{
				isOpen,
				openSidebar,
				closeSidebar,
				toggleSidebar,
			}}
		>
			{children}
		</AgentConfigSidebarContext.Provider>
	)
}

export function useAgentConfigSidebar() {
	const context = useContext(AgentConfigSidebarContext)
	if (!context) {
		throw new Error("useAgentConfigSidebar must be used within AgentConfigSidebarProvider")
	}
	return context
}
