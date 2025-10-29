export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  attachments?: any[]
  createdAt?: Date
}


