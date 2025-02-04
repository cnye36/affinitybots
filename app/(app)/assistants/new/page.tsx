"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createAgent } from "./actions";
import { AGENT_TEMPLATES } from './templates'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function NewAgentPage() {
  const router = useRouter()
  const [customPrompt, setCustomPrompt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateAgent = async (prompt: string, template = AGENT_TEMPLATES[0]) => {
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('prompt', prompt)
    formData.append('agentType', template.id)
    formData.append('useTemplate', template === AGENT_TEMPLATES[0] ? 'false' : 'true')

    const result = await createAgent(formData)
    
    if (result.error) {
      setError(result.error)
      setIsSubmitting(false)
    } else {
      router.push("/assistants");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/assistants" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create New Agent</h1>
        </div>

        <Tabs defaultValue="prompt" className="space-y-6">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="prompt">Create with Prompt</TabsTrigger>
            <TabsTrigger value="templates">Choose Template</TabsTrigger>
          </TabsList>

          <TabsContent value="prompt" className="space-y-4">
            <div className="gradient-border p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Describe Your AI Agent
              </h2>
              <p className="text-muted-foreground mb-4">
                Tell us what you want your AI agent to do, and we&apos;ll
                configure it with the right capabilities.
              </p>
              <Textarea
                placeholder="Example: I need an agent that can analyze my company's quarterly reports and provide key insights..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="h-32 mb-4"
              />
              <Button
                onClick={() => handleCreateAgent(customPrompt)}
                disabled={isSubmitting || !customPrompt.trim()}
                className="w-full"
              >
                {isSubmitting ? "Creating your agent..." : "Generate AI Agent"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {AGENT_TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  className="gradient-border p-6 rounded-lg cursor-pointer hover:scale-[1.02] transition-transform"
                  onClick={() =>
                    handleCreateAgent(template.basePrompt, template)
                  }
                >
                  <div className="flex items-center space-x-4">
                    <template.icon className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
} 