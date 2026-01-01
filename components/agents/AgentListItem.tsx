"use client"

import { useRouter } from "next/navigation"
import { Trash2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/useToast"
import { useState } from "react"
import { mutate } from "swr"
import { Assistant } from "@/types/assistant"
import Image from "next/image"
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers"
import { getLlmLabel } from "@/lib/llm/catalog"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { motion } from "framer-motion"

interface AgentListItemProps {
	assistant: Assistant
	onDelete: (assistantId: string) => void
}

export function AgentListItem({ assistant, onDelete }: AgentListItemProps) {
	const router = useRouter()
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

	const handleClick = () => {
		if (!assistant.assistant_id || assistant.assistant_id === "undefined") {
			console.error("Invalid agent ID")
			return
		}

		const assistantId = encodeURIComponent(assistant.assistant_id.trim())
		router.push(`/agents/${assistantId}`)
	}

	const handleDelete = async (e: React.MouseEvent) => {
		e.stopPropagation()
		try {
			const response = await fetch(`/api/agents/${assistant.assistant_id}`, {
				method: "DELETE",
			})

			if (!response.ok) {
				throw new Error("Failed to delete agent")
			}

			await mutate("/api/agents")
			onDelete(assistant.assistant_id)
			setIsDeleteDialogOpen(false)
			toast({
				title: "Agent deleted successfully",
			})
		} catch (error) {
			console.error("Error deleting agent:", error)
			toast({
				title: "Failed to delete agent",
				variant: "destructive",
			})
		}
	}

	const avatarUrl = assistant.metadata?.agent_avatar || ""

	const getEnabledMcpServers = (): string[] => {
		const enabled_mcp_servers: any = assistant.config?.configurable?.enabled_mcp_servers

		if (Array.isArray(enabled_mcp_servers)) {
			return enabled_mcp_servers as string[]
		}

		if (
			enabled_mcp_servers &&
			typeof enabled_mcp_servers === "object"
		) {
			return Object.entries(enabled_mcp_servers)
				.filter(([, v]) => (v as { isEnabled?: boolean })?.isEnabled)
				.map(([k]) => k)
		}
		return []
	}

	const modelLabel = getLlmLabel(
		assistant.config?.configurable?.llm,
		assistant.config?.configurable?.model
	)

	const enabledServers = getEnabledMcpServers()
	const toolLogos: Record<string, string> = {}
	OFFICIAL_MCP_SERVERS.forEach((s) => {
		if (enabledServers.includes(s.qualifiedName) && s.logoUrl) {
			toolLogos[s.qualifiedName] = s.logoUrl as string
		}
	})

	return (
		<>
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
				onClick={handleClick}
				className="group relative flex items-center gap-5 px-5 py-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-violet-500/40 transition-all duration-200 cursor-pointer"
			>
				{/* Gradient glow on hover */}
				<div className="absolute inset-0 bg-gradient-to-r from-violet-600/5 to-purple-600/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

				{/* Avatar */}
				<div className="relative flex-shrink-0">
					<div
						className="h-12 w-12 rounded-full ring-2 ring-border group-hover:ring-violet-500/30 flex items-center justify-center text-sm font-semibold text-white shadow-sm transition-all duration-200"
						style={{
							backgroundImage: avatarUrl ? `url(${avatarUrl})` : undefined,
							backgroundSize: "cover",
							backgroundPosition: "center",
							backgroundColor: !avatarUrl
								? `hsl(${(assistant.name.length * 30) % 360}, 70%, 50%)`
								: undefined,
						}}
					>
						{!avatarUrl && assistant.name.slice(0, 2).toUpperCase()}
					</div>
				</div>

				{/* Name and description */}
				<div className="relative flex-1 min-w-0">
					<div className="flex items-center gap-2 flex-wrap">
						<h3 className="text-base font-semibold text-foreground group-hover:text-violet-600 transition-colors duration-200 truncate">
							{assistant.name}
						</h3>
						<span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-medium whitespace-nowrap">
							{modelLabel}
						</span>
					</div>
					<p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
						{assistant.metadata?.description || "No description provided"}
					</p>
				</div>

				{/* Tools */}
				{enabledServers.length > 0 && (
					<div className="relative hidden md:flex items-center gap-1.5 flex-shrink-0">
						{enabledServers.slice(0, 3).map((name) => {
							const src = toolLogos[name]
							return (
								<div
									key={name}
									className="relative w-7 h-7 rounded-full ring-2 ring-border/50 overflow-hidden bg-muted flex items-center justify-center text-[10px] group-hover:ring-violet-500/20 transition-all duration-200 shadow-sm"
									title={name}
								>
									{src ? (
										<Image
											src={src}
											alt={name}
											width={28}
											height={28}
											className="object-cover"
										/>
									) : (
										<span>🛠️</span>
									)}
								</div>
							)
						})}
						{enabledServers.length > 3 && (
							<div className="w-7 h-7 rounded-full ring-2 ring-border/50 bg-muted text-[10px] flex items-center justify-center font-semibold text-foreground">
								+{enabledServers.length - 3}
							</div>
						)}
					</div>
				)}

				{/* Delete button */}
				<div className="relative flex-shrink-0">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
						onClick={(e) => {
							e.stopPropagation()
							setIsDeleteDialogOpen(true)
						}}
					>
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</motion.div>

			<AlertDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete your
							agent and any workflows using this agent will fail.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete Agent
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}
