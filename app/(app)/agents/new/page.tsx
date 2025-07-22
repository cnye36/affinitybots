"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link";
import logger from "@/lib/logger";
import { AGENT_TEMPLATES } from "./templates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentCreationDialog } from "@/components/agents/AgentCreationDialog";

export default function NewAgentPage() {
  const router = useRouter();
  const [customPrompt, setCustomPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreationDialog, setShowCreationDialog] = useState(false);

  const handleCreateAgent = async (
    prompt: string,
    template = AGENT_TEMPLATES[0]
  ) => {
    setIsSubmitting(true);
    setError(null);
    setShowCreationDialog(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          agentType: template.id,
          useTemplate: template === AGENT_TEMPLATES[0] ? false : true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create agent");
      }

      const data = await response.json();
      logger.debug(data);
      router.push("/agents");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
      setIsSubmitting(false);
      setShowCreationDialog(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-8">
          <Link href="/agents" className="mr-4">
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

      <AgentCreationDialog
        isOpen={showCreationDialog}
        onClose={() => setShowCreationDialog(false)}
      />
    </div>
  );
} 