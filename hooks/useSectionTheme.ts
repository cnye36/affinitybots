"use client"

import { usePathname } from "next/navigation"
import { getSectionFromPath, getSectionTheme, type SectionTheme } from "@/lib/sectionColors"

/**
 * Hook to get the current section theme based on the pathname
 */
export function useSectionTheme(): SectionTheme {
	const pathname = usePathname()
	const section = getSectionFromPath(pathname)
	return getSectionTheme(section)
}

/**
 * Hook to get the current section key
 */
export function useCurrentSection(): string {
	const pathname = usePathname()
	return getSectionFromPath(pathname)
}
