"use client"

import { useState } from "react"
import { Tool, ServerInfo } from "@/types/playground"
import { usePlaygroundStore } from "@/lib/stores/playgroundStore"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronRight, Search, CheckSquare, Square } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface ToolSelectorProps {
	tools: Tool[]
	servers: ServerInfo[]
	selectedTools: string[]
	isLoading?: boolean
}

export function ToolSelector({ tools, servers, selectedTools, isLoading }: ToolSelectorProps) {
	const { toggleTool, setSelectedTools } = usePlaygroundStore()
	const [searchQuery, setSearchQuery] = useState("")
	const [expandedServers, setExpandedServers] = useState<Set<string>>(new Set())

	const toggleServer = (serverName: string) => {
		setExpandedServers(prev => {
			const next = new Set(prev)
			if (next.has(serverName)) {
				next.delete(serverName)
			} else {
				next.add(serverName)
			}
			return next
		})
	}

	const selectAllTools = () => {
		setSelectedTools(tools.map(t => t.name))
	}

	const deselectAllTools = () => {
		setSelectedTools([])
	}

	const toggleServerTools = (serverName: string, select: boolean) => {
		const serverTools = tools.filter(t => t.serverName === serverName)
		const serverToolNames = serverTools.map(t => t.name)

		if (select) {
			setSelectedTools([...new Set([...selectedTools, ...serverToolNames])])
		} else {
			setSelectedTools(selectedTools.filter(name => !serverToolNames.includes(name)))
		}
	}

	const filteredTools = tools.filter(tool =>
		tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		tool.description.toLowerCase().includes(searchQuery.toLowerCase())
	)

	const groupedTools = servers.map(server => ({
		server,
		tools: filteredTools.filter(t => t.serverName === server.name),
	})).filter(group => group.tools.length > 0)

	if (isLoading) {
		return (
			<div className="space-y-2">
				<Label>Tools</Label>
				<div className="space-y-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			</div>
		)
	}

	if (tools.length === 0) {
		return (
			<div className="space-y-2">
				<Label>Tools</Label>
				<div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
					No tools available for this agent
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label>Tools ({selectedTools.length}/{tools.length})</Label>
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="sm"
						onClick={selectAllTools}
						className="h-7 px-2 text-xs"
					>
						Select All
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={deselectAllTools}
						className="h-7 px-2 text-xs"
					>
						Clear
					</Button>
				</div>
			</div>

			<div className="relative">
				<Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
				<Input
					placeholder="Search tools..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="pl-8 h-9"
				/>
			</div>

			<ScrollArea className="h-[400px] border rounded-lg">
				<div className="p-2 space-y-2">
					{groupedTools.map(({ server, tools: serverTools }) => {
						const isExpanded = expandedServers.has(server.name)
						const selectedCount = serverTools.filter(t => selectedTools.includes(t.name)).length
						const allSelected = selectedCount === serverTools.length
						const someSelected = selectedCount > 0 && !allSelected

						return (
							<div key={server.name} className="border rounded-lg">
								<div className="flex items-center gap-2 p-2 bg-muted/50">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleServer(server.name)}
										className="h-6 w-6 p-0"
									>
										{isExpanded ? (
											<ChevronDown className="h-4 w-4" />
										) : (
											<ChevronRight className="h-4 w-4" />
										)}
									</Button>

									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleServerTools(server.name, !allSelected)}
										className="h-6 w-6 p-0"
									>
										{allSelected ? (
											<CheckSquare className="h-4 w-4" />
										) : someSelected ? (
											<Square className="h-4 w-4 fill-primary/20" />
										) : (
											<Square className="h-4 w-4" />
										)}
									</Button>

									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2">
											<span className="font-medium text-sm">{server.displayName}</span>
											<span className="text-xs text-muted-foreground">
												{selectedCount}/{serverTools.length}
											</span>
										</div>
									</div>
								</div>

								{isExpanded && (
									<div className="p-2 space-y-1">
										{serverTools.map((tool) => (
											<label
												key={tool.name}
												className="flex items-start gap-2 p-2 rounded hover:bg-accent cursor-pointer"
											>
												<Checkbox
													checked={selectedTools.includes(tool.name)}
													onCheckedChange={() => toggleTool(tool.name)}
													className="mt-0.5"
												/>
												<div className="flex-1 min-w-0">
													<div className="font-medium text-sm">{tool.displayName}</div>
													<div className="text-xs text-muted-foreground line-clamp-2">
														{tool.description}
													</div>
												</div>
											</label>
										))}
									</div>
								)}
							</div>
						)
					})}
				</div>
			</ScrollArea>
		</div>
	)
}
