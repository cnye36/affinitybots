"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTutorial } from "@/contexts/TutorialContext"
import { RefreshCw, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "@/hooks/useToast"
import { createClient } from "@/supabase/client"

const tutorialsList = [
	{ id: "dashboard", name: "Dashboard Tour", description: "Overview of your dashboard features" },
	{ id: "agents-list", name: "Agents Management", description: "Learn to manage your AI agents" },
	{ id: "agent-chat", name: "Agent Chat", description: "How to interact with your agents" },
	{ id: "workflows", name: "Workflows Introduction", description: "Automate tasks with workflows" },
]

export function TutorialSettings() {
	const [isResetting, setIsResetting] = useState(false)
	const [completedTutorials, setCompletedTutorials] = useState<Record<string, boolean>>({})
	const supabase = createClient()

	// Load completed tutorials from database
	useEffect(() => {
		async function loadCompletedTutorials() {
			try {
				const { data: { user } } = await supabase.auth.getUser()
				if (!user) return

				const { data: completions } = await supabase
					.from("user_tutorial_completion")
					.select("tutorial_id")
					.eq("user_id", user.id)

				const completed: Record<string, boolean> = {}
				completions?.forEach((c: any) => {
					completed[c.tutorial_id] = true
				})
				setCompletedTutorials(completed)
			} catch (error) {
				console.error("Failed to load tutorial completions:", error)
			}
		}

		loadCompletedTutorials()
	}, [supabase])

	/**
	 * Reset all tutorials
	 */
	const handleResetAll = async () => {
		try {
			setIsResetting(true)

			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				await supabase
					.from("user_tutorial_completion")
					.delete()
					.eq("user_id", user.id)
			}

			// Also clear localStorage for backward compatibility
			localStorage.removeItem("agenthub-tutorials")

			// Clear local state
			setCompletedTutorials({})

			toast({
				title: "Tutorials reset successfully",
				description: "All tutorials will now show again on your next visit to each page.",
			})
		} catch (error) {
			console.error("Failed to reset tutorials:", error)
			toast({
				title: "Failed to reset tutorials",
				description: error instanceof Error ? error.message : "Please try again",
				variant: "destructive",
			})
		} finally {
			setTimeout(() => setIsResetting(false), 500)
		}
	}

	/**
	 * Reset a specific tutorial
	 */
	const handleResetTutorial = async (tutorialId: string, tutorialName: string) => {
		try {
			const { data: { user } } = await supabase.auth.getUser()
			if (user) {
				await supabase
					.from("user_tutorial_completion")
					.delete()
					.eq("user_id", user.id)
					.eq("tutorial_id", tutorialId)
			}

			// Also clear from localStorage for backward compatibility
			const stored = localStorage.getItem("agenthub-tutorials")
			if (stored) {
				const state = JSON.parse(stored)
				state.completed[tutorialId] = false
				state.progress[tutorialId] = 0
				state.lastUpdated = new Date().toISOString()
				localStorage.setItem("agenthub-tutorials", JSON.stringify(state))
			}

			// Update local state
			setCompletedTutorials(prev => ({
				...prev,
				[tutorialId]: false,
			}))

			toast({
				title: `${tutorialName} reset`,
				description: "This tutorial will show again on your next visit to the page.",
			})
		} catch (error) {
			console.error("Failed to reset tutorial:", error)
			toast({
				title: "Failed to reset tutorial",
				description: error instanceof Error ? error.message : "Please try again",
				variant: "destructive",
			})
		}
	}

	/**
	 * Check if a tutorial has been completed
	 */
	const isTutorialCompleted = (tutorialId: string): boolean => {
		return completedTutorials[tutorialId] || false
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Tutorial Settings</CardTitle>
				<CardDescription>
					Manage your onboarding tutorials. Reset tutorials to see them again.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Tutorial list */}
				<div className="space-y-3">
					{tutorialsList.map((tutorial) => {
						const completed = isTutorialCompleted(tutorial.id)

						return (
							<div
								key={tutorial.id}
								className="flex items-center justify-between p-4 border rounded-lg"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<h3 className="font-medium">{tutorial.name}</h3>
										{completed && (
											<Badge variant="secondary" className="gap-1">
												<CheckCircle2 className="h-3 w-3" />
												Completed
											</Badge>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										{tutorial.description}
									</p>
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => handleResetTutorial(tutorial.id, tutorial.name)}
									className="ml-4"
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Reset
								</Button>
							</div>
						)
					})}
				</div>

				{/* Reset all button */}
				<div className="pt-4 border-t">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="font-medium mb-1">Reset All Tutorials</h3>
							<p className="text-sm text-muted-foreground">
								Clear all tutorial progress and start fresh
							</p>
						</div>
						<Button
							variant="outline"
							onClick={handleResetAll}
							disabled={isResetting}
						>
							<RefreshCw className={`h-4 w-4 mr-2 ${isResetting ? "animate-spin" : ""}`} />
							Reset All
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
