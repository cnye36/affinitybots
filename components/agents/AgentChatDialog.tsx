'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, SendHorizontal, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgentChatDialogProps {
  agentId: string
  agentName: string
  description?: string
  modelType?: string
  tools?: { name: string }[]
}

export function AgentChatDialog({ 
  agentId, 
  agentName,
  description,
  modelType,
  tools = []
}: AgentChatDialogProps) {
  const [open, setOpen] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: `/api/agents/${agentId}/chat`,
    id: agentId,
    initialMessages: [],
    body: {
      agentId,
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  // Handle form submission
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (input.trim()) {
      handleSubmit(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="hover:bg-primary/10">
          <MessageSquare className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Bot className="h-5 w-5 text-primary" />
            {agentName}
          </DialogTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
          <div className="flex gap-2 text-xs text-muted-foreground mt-2">
            {modelType && <span className="bg-secondary px-2 py-1 rounded-md">Model: {modelType}</span>}
            {tools.length > 0 && (
              <span className="bg-secondary px-2 py-1 rounded-md">
                Tools: {tools.map(t => t.name).join(', ')}
              </span>
            )}
          </div>
        </DialogHeader>

        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 p-4 overflow-y-auto"
        >
          <div className="space-y-4 mb-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center py-6">
                <Bot className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Start a conversation with {agentName}!
                </p>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-2 items-start',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role !== 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-lg px-4 py-2 max-w-[80%] text-sm',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                    {message.content[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 items-start">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex justify-center">
                <div className="bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-2">
                  Error: {error.message}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2"
          >
            <Input
              placeholder={`Message ${agentName}...`}
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
} 