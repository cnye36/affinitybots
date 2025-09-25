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
import { useOnboarding, newAgentTutorialSteps } from "@/hooks/useOnboarding";
import { createClient } from "@/supabase/client";

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
  const [knowledgeStatuses, setKnowledgeStatuses] = useState<Record<string, { status: 'queued'|'uploading'|'success'|'error'; error?: string }>>({});

  const allowedFileTypes = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/json",
    "text/markdown",
    "application/xml",
    "text/xml",
    "text/html",
  ];

  // Auto-start the New Agent onboarding tour on first visit (per-user gated)
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const seenLocal = localStorage.getItem('onboarding-new-agent-seen')
        let completedDb = false
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('preferences')
            .eq('id', user.id)
            .single()
          completedDb = Boolean((data?.preferences as any)?.onboardingCompleted)
        }
        if (!completedDb && !seenLocal && !isActive) {
          localStorage.setItem('onboarding-new-agent-seen', 'true')
          setTimeout(() => startTour(newAgentTutorialSteps), 300)
        }
      } catch (e) {
        // Local fallback
        const seen = localStorage.getItem('onboarding-new-agent-seen')
        if (!seen && !isActive) {
          localStorage.setItem('onboarding-new-agent-seen', 'true')
          setTimeout(() => startTour(newAgentTutorialSteps), 300)
        }
      }
    })()
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
      // If user queued knowledge files, upload them now with status updates
      if (knowledgeFiles.length > 0 && data?.assistant?.assistant_id) {
        // Initialize statuses for any missing
        setKnowledgeStatuses(prev => {
          const next = { ...prev };
          for (const f of knowledgeFiles) {
            if (!next[f.name]) next[f.name] = { status: 'queued' };
          }
          return next;
        });

        const successfulFiles: string[] = [];

        for (const file of knowledgeFiles) {
          setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'uploading' } }));
          const formData = new FormData();
          formData.append("file", file);
          formData.append("assistantId", data.assistant.assistant_id);
          try {
            const resp = await fetch("/api/knowledge", { method: "POST", body: formData });
            if (!resp.ok) {
              let errMsg = `Upload failed (${resp.status})`;
              try {
                const errJson = await resp.json();
                if (errJson?.error) errMsg = errJson.error;
              } catch {}
              setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'error', error: errMsg } }));
              continue;
            }
            setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'success' } }));
            successfulFiles.push(file.name);
          } catch (e) {
            const errMsg = e instanceof Error ? e.message : 'Network error';
            setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'error', error: errMsg } }));
          }
        }

        // If any uploads succeeded, persist sources to assistant config now
        if (successfulFiles.length > 0) {
          try {
            await fetch(`/api/assistants/${data.assistant.assistant_id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                config: {
                  configurable: {
                    knowledge_base: {
                      isEnabled: true,
                      config: { sources: successfulFiles }
                    }
                  }
                }
              })
            });
          } catch {}
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
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <Link href="/agents">
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
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <h3 className="font-medium">Add Tools (Optional)</h3>
                    </div>
                    {enabledMCPServers.length > 0 && (
                      <span className="text-xs text-muted-foreground">{enabledMCPServers.length} selected</span>
                    )}
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

          {/* Knowledge (Accordion) */}
          <div className="gradient-border p-0 rounded-lg" data-tutorial="agent-knowledge">
            <Accordion type="single" collapsible>
              <AccordionItem value="knowledge">
                <AccordionTrigger className="px-4">
                  <div className="flex items-center gap-2 w-full justify-between">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      <h3 className="font-medium">Add Knowledge (Optional)</h3>
                    </div>
                    {knowledgeFiles.length > 0 && (
                      <span className="text-xs text-muted-foreground">{knowledgeFiles.length} file{knowledgeFiles.length>1?'s':''} queued</span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4">
                  <div className="p-3 space-y-3">
                    <div
                      onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                      onDrop={(e) => {
                        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
                        const files = Array.from(e.dataTransfer.files || []);
                        const dropped = files.filter((file) => file.name.endsWith('.csv') || file.name.endsWith('.docx') || file.name.endsWith('.html') || file.name.endsWith('.htm') || allowedFileTypes.includes(file.type));
                        setKnowledgeFiles((prev) => [...prev, ...dropped]);
                      }}
                      className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
                    >
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.txt,.docx,.csv,.xls,.xlsx,.json,.md,.xml,.html,.htm"
                        className="hidden"
                        id="kb-upload"
                        onChange={(e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          const picked = files.filter((file) => file.name.endsWith('.csv') || file.name.endsWith('.docx') || file.name.endsWith('.html') || file.name.endsWith('.htm') || allowedFileTypes.includes(file.type));
                          setKnowledgeFiles((prev) => [...prev, ...picked]);
                        }}
                      />
                      <label htmlFor="kb-upload" className="cursor-pointer">
                        <p>{isDragging ? 'Drop files here…' : 'Drag & drop files, or click to select'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Files upload after the agent is created.</p>
                      </label>
                    </div>

                    {knowledgeFiles.length > 0 && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Queued files</div>
                        <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                          {knowledgeFiles.map((f) => {
                            const st = knowledgeStatuses[f.name]?.status || 'queued';
                            const err = knowledgeStatuses[f.name]?.error;
                            return (
                              <li key={f.name} className="text-xs flex items-start justify-between gap-2">
                                <span className="truncate flex-1">{f.name}</span>
                                <span className={`shrink-0 ${st==='success'?'text-green-600': st==='error'?'text-red-600': st==='uploading'?'text-amber-600':'text-muted-foreground'}`}>
                                  {st}
                                </span>
                                {err && <span className="text-red-600 truncate max-w-[180px]" title={err}>: {err}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
