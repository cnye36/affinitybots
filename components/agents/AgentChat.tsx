'use client'

import { useRef, useEffect } from 'react'
import { useChat } from 'ai/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SendHorizontal, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

interface AgentChatProps {
  agentId: string
  agentName: string
  threadId?: string
}

export function AgentChat({ 
  agentId, 
  agentName,
  threadId,
}: AgentChatProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, setMessages } = useChat({ 
    api: `/api/agents/${agentId}/chat`,
    id: threadId,
    body: {
      agentId,
      threadId
    },
    onResponse: async (response) => {
      // Save chat after first interaction if no threadId exists
      if (!threadId && messages.length === 1) {
        try {
          const saveResponse = await fetch(`/api/agents/${agentId}/threads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: messages[0].content.slice(0, 100),
              messages: messages
            })
          });
          
          if (!saveResponse.ok) throw new Error('Failed to save chat');
          const data = await saveResponse.json();
          window.location.href = `/agents/${agentId}?thread=${data.threadId}`;
        } catch (error) {
          console.error('Error saving chat:', error);
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error)
    }
  })

  // Load messages when thread changes
  useEffect(() => {
    async function loadMessages() {
      if (!threadId) {
        setMessages([])
        return
      }

      try {
        const response = await fetch(`/api/agents/${agentId}/chat?threadId=${threadId}`)
        if (!response.ok) throw new Error('Failed to load messages')
        const data = await response.json()
        setMessages(data.messages)
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    loadMessages()
  }, [threadId, agentId, setMessages])

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      const isAtBottom = scrollArea.scrollHeight - scrollArea.scrollTop <= scrollArea.clientHeight + 100;
      
      if (isAtBottom) {
        scrollArea.scrollTo({
          top: scrollArea.scrollHeight,
          behavior: 'smooth'
        });
      }
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
    <div className="flex-1 flex flex-col h-full">
      <ScrollArea 
        ref={scrollAreaRef} 
        className="flex-1 px-4 py-6"
        type="hover"
      >
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">
                Start a new conversation with {agentName}!
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-3 items-start',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={cn(
                  'rounded-lg px-4 py-2 max-w-[85%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground dark:bg-primary/10'
                    : 'bg-muted'
                )}
              >
                <ReactMarkdown
                  className={cn(
                    'prose prose-sm max-w-none break-words',
                    message.role === 'user' 
                      ? 'prose-invert' 
                      : 'prose-stone dark:prose-invert'
                  )}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw, rehypeSanitize, rehypeHighlight]}
                  components={{
                    pre: ({ node, ...props }) => (
                      <pre className="bg-zinc-950 rounded-md p-4 overflow-x-auto" {...props} />
                    ),
                    code: ({ node, inline, ...props }) => (
                      inline 
                        ? <code className="bg-zinc-800 rounded px-1 py-0.5" {...props} />
                        : <code {...props} />
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                  {message.content[0].toUpperCase()}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2 max-w-[85%]">
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

      <div className="flex-shrink-0 border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-3"
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
      </div>
    </div>
  )
} 