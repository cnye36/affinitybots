export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: any[]
  createdAt?: Date
  reasoning?: string // Reasoning tokens from models like o1/o3
}


