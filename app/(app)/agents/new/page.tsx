"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from "next/link";
import { AGENT_TEMPLATES } from "./templates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, Plus, Upload, Wand2, Wand } from "lucide-react";
import { AgentCreationDialog } from "@/components/agents/AgentCreationDialog";
import { Input } from "@/components/ui/input";
import { ToolSelector } from "@/components/configuration/ToolSelector";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useOnboarding, newAgentTutorialSteps } from "@/hooks/use-onboarding";

export default function NewAgentPage() {
  const router = useRouter();
  const { startTour, isActive } = useOnboarding();
  const [customPrompt, setCustomPrompt] = useState("");
  const [customName, setCustomName] = useState("");
  // No explicit agent type; template clicks only prefill prompt
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreationDialog, setShowCreationDialog] = useState(false);
  const [enabledMCPServers, setEnabledMCPServers] = useState<string[]>([]);

  // Knowledge upload queue (processed after assistant is created)
  const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const allowedFileTypes = [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/json",
    "text/markdown",
    "application/xml",
    "text/xml",
  ];

  // Auto-start the New Agent onboarding tour on first visit
  useEffect(() => {
    try {
      const seen = localStorage.getItem('onboarding-new-agent-seen')
      if (!seen && !isActive) {
        localStorage.setItem('onboarding-new-agent-seen', 'true')
        setTimeout(() => startTour(newAgentTutorialSteps), 300)
      }
    } catch (e) {
      // no-op
    }
  }, [startTour, isActive])

  const handleCreateAgent = async (prompt: string) => {
    setIsSubmitting(true);
    setError(null);
    setShowCreationDialog(true);

    try {
      const response = await fetch("/api/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          preferredName: customName || undefined,
          enabledMCPServers,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create agent");
      }

      const data = await response.json();
      // If user queued knowledge files, upload them now
      if (knowledgeFiles.length > 0 && data?.assistant?.assistant_id) {
        for (const file of knowledgeFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("assistantId", data.assistant.assistant_id);
          try {
            await fetch("/api/knowledge", { method: "POST", body: formData });
          } catch (e) {
            console.error("Knowledge upload failed for", file.name, e);
          }
        }
      }

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

        <div className="space-y-6">
          {/* Optional Name */}
          <div className="gradient-border p-6 rounded-lg" data-tutorial="agent-name">
            <Label className="mb-2 block">Name (Optional)</Label>
            <Input
              placeholder="e.g., Prism Atlas"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-2">Leave blank to auto-generate a creative name.</p>
          </div>

          {/* Prompt */}
          <div className="gradient-border p-6 rounded-lg" data-tutorial="agent-description">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Describe Your AI Agent (Required)
            </h2>
            <p className="text-muted-foreground mb-4">
              Tell us what you want your AI agent to do. We’ll infer the best agent profile, craft a strong system prompt, and set sensible defaults.
            </p>
            <Textarea
              placeholder="Example: I need an agent that can help me with my marketing research."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="h-32 mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => handleCreateAgent(customPrompt)}
                disabled={isSubmitting || !customPrompt.trim()}
                className="flex-1"
              >
                {isSubmitting ? "Creating your agent..." : "Create Agent"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isEnhancing || !customPrompt.trim()}
                onClick={async () => {
                  try {
                    setIsEnhancing(true);
                    const res = await fetch('/api/prompt/enhance', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ prompt: customPrompt })
                    });
                    if (!res.ok) throw new Error('Failed to enhance prompt');
                    const data = await res.json();
                    if (data?.enhancedPrompt) setCustomPrompt(data.enhancedPrompt);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsEnhancing(false);
                  }
                }}
                title="Enhance prompt"
              >
                <Wand className="h-4 w-4 mr-2" />
                {isEnhancing ? 'Enhancing…' : 'Enhance'}
              </Button>
            </div>
          </div>

          {/* Tools (Accordion) */}
          <div className="gradient-border p-0 rounded-lg" data-tutorial="agent-tools">
            <Accordion type="single" collapsible>
              <AccordionItem value="tools">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <h3 className="font-medium">Add Tools (Optional)</h3>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="p-3">
                    <ToolSelector
                      enabledMCPServers={enabledMCPServers}
                      onMCPServersChange={setEnabledMCPServers}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Knowledge (Dropdown) */}
          <div className="gradient-border p-4 rounded-lg flex items-center justify-between" data-tutorial="agent-knowledge">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <h3 className="font-medium">Add Knowledge (Optional)</h3>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">Upload</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[420px] p-4">
                <div
                  onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation(); setIsDragging(false);
                    const files = Array.from(e.dataTransfer.files || []);
                    const valid = files.filter((file) => file.name.endsWith('.csv') || allowedFileTypes.includes(file.type));
                    setKnowledgeFiles((prev) => [...prev, ...valid]);
                  }}
                  className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                >
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.txt,.doc,.docx,.csv,.xls,.xlsx,.json,.md,.xml"
                    className="hidden"
                    id="kb-upload"
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      const valid = files.filter((file) => file.name.endsWith('.csv') || allowedFileTypes.includes(file.type));
                      setKnowledgeFiles((prev) => [...prev, ...valid]);
                    }}
                  />
                  <label htmlFor="kb-upload" className="cursor-pointer">
                    <p>{isDragging ? 'Drop files here…' : 'Drag & drop files, or click to select'}</p>
                    <p className="text-xs text-muted-foreground mt-1">Files upload after the agent is created.</p>
                  </label>
                </div>
                {knowledgeFiles.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Queued: {knowledgeFiles.map((f) => f.name).join(', ')}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Templates as pills under prompt; click to populate */}
          <div className="space-y-2" data-tutorial="agent-templates">
            <div className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Start from a template</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {AGENT_TEMPLATES.map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setCustomPrompt(template.basePrompt)}
                >
                  <template.icon className="h-4 w-4 mr-2" />
                  {template.name}
                </Button>
              ))}
            </div>
          </div>
        </div>

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
