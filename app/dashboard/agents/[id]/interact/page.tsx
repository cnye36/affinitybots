"use client"

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useChat } from 'ai/react'

export default function InteractAgentPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const [error, setError] = useState<string | null>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: `/api/agents/${params.id}/interact`,
    onError: (error) => {
      console.error('Chat error:', error)
      setError(error.message || 'Failed to get response from agent')
    },
    formatResponse: (data: any) => {
      if (data.response) {
        return [{ role: 'agent', content: data.response }]
      }
      return []
    },
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/agents" className="flex items-center mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span>Back to Agents</span>
      </Link>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Chat with Agent</h1>

        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div key={message.id}>
              <p className="text-sm text-gray-500">
                {message.role === 'user' ? 'You:' : 'Agent:'}
              </p>
              <p className="mb-2 text-base whitespace-pre-wrap">
                {message.content}
              </p>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-4 border border-destructive rounded-lg bg-destructive text-destructive-foreground">
            {error}
          </div>
        )}

        <form onSubmit={(e) => {
          e.preventDefault();
          if (!input.trim()) {
            setError('Message cannot be empty');
            return;
          }
          console.log('Sending message:', input);
          handleSubmit(e);
        }} className="space-y-4">
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message to the agent..."
            className="h-24"
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send'}
          </Button>
        </form>
      </div>
    </div>
  )
}