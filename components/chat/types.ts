import type { EnhancedMemory } from "@/types/memory"

export interface ToolCall {
  id: string
  name: string
  args?: Record<string, any>
  arguments?: any
  result?: any
  mcpServer?: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "approval"
  content: string
  attachments?: any[]
  createdAt?: Date
  reasoning?: string // Reasoning tokens from models like o1/o3
  toolCalls?: ToolCall[]
  memorySaved?: EnhancedMemory
  pendingApproval?: {
    toolCalls: ToolCall[]
    onApprove: (approvedTools: ToolCall[], approvalType: "once" | "always-tool" | "always-integration") => void
    onDeny: () => void
  }
}

