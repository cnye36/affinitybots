"use client"

import { useRef, useState } from "react"
import { ArrowLeftIcon, Menu, Settings2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { Assistant } from "@/types/assistant"
import { Chat } from "@/components/chat/Chat"
import ThreadSidebar, { ThreadSidebarRef } from "@/components/chat/ThreadSidebar"
import { useAgentConfigPanel } from "@/contexts/AgentConfigPanelContext"
import { useRouter } from "next/navigation"

interface ChatContainerProps {
	assistant: Assistant
}

export default function ChatContainer({ assistant }: ChatContainerProps) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)
	const sidebarRef = useRef<ThreadSidebarRef>(null)
	const [threadId, setThreadId] = useState<string | null>(null)
	const { isOpen: isConfigPanelOpen, togglePanel } = useAgentConfigPanel()
	const router = useRouter()

	const handleThreadSelect = (selectedThreadId: string) => {
		setThreadId(selectedThreadId)
		setIsSidebarOpen(false) // Close sidebar on mobile after selection
	}

	const handleNewThread = () => {
		setThreadId(null)
		setIsSidebarOpen(false) // Close sidebar on mobile after creating new thread
	}

	return (
		<TooltipProvider>
			<div className="flex flex-1 min-h-0 bg-background">
				{/* Thread list sidebar */}
				<div
					className={cn(
						"border-r transition-all duration-300 flex-shrink-0 overflow-hidden relative z-40",
						isSidebarOpen ? "w-72 sm:w-80" : "w-0 lg:w-80"
					)}
				>
					<div className="h-full w-72 sm:w-80 lg:w-80">
						<ThreadSidebar
							ref={sidebarRef}
							assistantId={assistant.assistant_id}
							currentThreadId={threadId || undefined}
							onThreadSelect={handleThreadSelect}
							onNewThread={handleNewThread}
						/>
					</div>
				</div>

				{/* Main Chat Area */}
				<div
					className={cn(
						"flex-1 flex flex-col min-w-0 transition-all duration-300"
					)}
				>
					{/* Local chat header (mobile only: thread toggle + config) */}
					<div className="border-b px-4 py-3 flex items-center gap-3 lg:hidden">
						{/* Thread sidebar toggle (mobile) */}
						<Button
							variant="ghost"
							size="icon"
							className="ml-1"
							onClick={() => setIsSidebarOpen(!isSidebarOpen)}
							aria-label={isSidebarOpen ? "Close thread list" : "Open thread list"}
						>
							{isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</Button>

						<div className="ml-auto flex items-center gap-2">
							{/* Mobile / tablet: icon-only config button opens sheet/modal */}
							<Button
								variant="ghost"
								size="icon"
								className=""
								onClick={togglePanel}
								aria-label={isConfigPanelOpen ? "Hide configuration" : "Show configuration"}
							>
								<Settings2 className="h-5 w-5" />
							</Button>
						</div>
					</div>

					{/* Thread Chat (migrated to useStream) */}
					<div className="flex-1 overflow-hidden">
						<Chat
							assistantId={assistant.assistant_id}
							threadId={threadId}
							onThreadId={setThreadId}
						/>
					</div>
				</div>

				{/* Mobile Overlay */}
				{isSidebarOpen && (
					<div
						className="fixed inset-0 bg-black/50 z-30 lg:hidden"
						onClick={() => setIsSidebarOpen(false)}
					/>
				)}
			</div>
		</TooltipProvider>
	)
}

