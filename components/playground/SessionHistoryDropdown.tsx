"use client"

import { useState, useEffect } from "react"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Workflow, Trash2, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { PlaygroundSession } from "@/types/playground"
import { useToast } from "@/hooks/useToast"

interface SessionHistoryDropdownProps {
	children: React.ReactNode
}

export function SessionHistoryDropdown({ children }: SessionHistoryDropdownProps) {
	const { loadSession } = usePlaygroundStore()
	const [sessions, setSessions] = useState<PlaygroundSession[]>([])
	const [loading, setLoading] = useState(false)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [open, setOpen] = useState(false)
	const { toast } = useToast()

	useEffect(() => {
		if (open) {
			fetchSessions()
		}
	}, [open])

	const fetchSessions = async () => {
		setLoading(true)
		try {
			const response = await fetch("/api/playground/sessions")
			if (response.ok) {
				const data = await response.json()
				setSessions(data || [])
			}
		} catch (error) {
			console.error("Error fetching sessions:", error)
			toast({
				title: "Error",
				description: "Failed to load session history",
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}

	const handleLoadSession = async (sessionId: string) => {
		try {
			await loadSession(sessionId)
			setOpen(false)
			toast({
				title: "Session loaded",
				description: "Successfully loaded session history",
			})
		} catch (error) {
			toast({
				title: "Error",
				description: "Failed to load session",
				variant: "destructive",
			})
		}
	}

	const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
		e.stopPropagation()
		setDeletingId(sessionId)
		try {
			const response = await fetch(`/api/playground/sessions/${sessionId}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				throw new Error("Failed to delete session")
			}

			// Update local state immediately to remove the deleted session from UI
			setSessions(prevSessions => {
				const filtered = prevSessions.filter(s => s.session_id !== sessionId)
				console.log("Filtered sessions:", filtered.length, "from", prevSessions.length)
				return filtered
			})

			toast({
				title: "Session deleted",
				description: "Successfully deleted session",
			})
		} catch (error) {
			console.error("Delete error:", error)
			toast({
				title: "Error",
				description: "Failed to delete session",
				variant: "destructive",
			})
		} finally {
			setDeletingId(null)
		}
	}

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				{children}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-[400px] p-0"
				align="start"
				sideOffset={8}
			>
				<div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
					<Clock className="h-4 w-4 text-muted-foreground" />
					<h3 className="font-semibold text-sm">Session History</h3>
				</div>

				{loading ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				) : sessions.length === 0 ? (
					<div className="text-center py-12 px-4 text-muted-foreground">
						<Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
						<p className="text-sm font-medium">No session history yet</p>
						<p className="text-xs mt-1">Your playground sessions will appear here</p>
					</div>
				) : (
					<ScrollArea className="max-h-[400px]">
						<div className="p-2">
							{sessions.map((session) => (
								<button
									key={session.session_id}
									onClick={() => handleLoadSession(session.session_id)}
									className="w-full text-left p-3 rounded-md hover:bg-accent transition-colors group mb-1"
								>
									<div className="flex items-start justify-between gap-3">
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1.5">
												{session.mode === "orchestrator" ? (
													<Users className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
												) : (
													<Workflow className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
												)}
												<span className="font-medium text-sm truncate">
													{session.name || "Untitled Session"}
												</span>
											</div>

											<div className="flex items-center gap-2 flex-wrap">
												<Badge
													variant={session.mode === "orchestrator" ? "default" : "secondary"}
													className={`text-xs h-5 ${
														session.mode === "orchestrator"
															? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0"
															: ""
													}`}
												>
													{session.mode === "orchestrator" ? "Orchestrator" : "Sequential"}
												</Badge>

												<span className="text-xs text-muted-foreground">
													{formatDistanceToNow(new Date(session.updated_at || session.created_at), {
														addSuffix: true,
													})}
												</span>
											</div>
										</div>

										<div
											className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 flex items-center justify-center rounded-md hover:bg-accent cursor-pointer"
											onClick={(e) => {
												if (deletingId !== session.session_id) {
													handleDeleteSession(session.session_id, e)
												}
											}}
										>
											{deletingId === session.session_id ? (
												<Loader2 className="h-3.5 w-3.5 animate-spin" />
											) : (
												<Trash2 className="h-3.5 w-3.5 text-destructive" />
											)}
										</div>
									</div>
								</button>
							))}
						</div>
					</ScrollArea>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
