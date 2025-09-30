"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/useToast";
import { TriggerType } from "@/types/workflow";
import { AlarmClock, Globe2, Play, PlugZap, FileText, Copy, Check } from "lucide-react";

type TriggerRecord = {
  trigger_id: string;
  workflow_id: string;
  name: string;
  description?: string | null;
  trigger_type: TriggerType;
  config: Record<string, unknown> | null;
};

type TriggerMeta = {
  type: TriggerType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  comingSoon: boolean;
};

const TRIGGER_META: Record<TriggerType, TriggerMeta> = {
  manual: {
    type: "manual",
    title: "Manual",
    description: "Start this workflow manually from the UI or API.",
    icon: <Play className="h-4 w-4" />,
    color: "primary",
    comingSoon: false,
  },
  webhook: {
    type: "webhook",
    title: "Webhook",
    description: "Trigger when an authenticated HTTP request is received.",
    icon: <Globe2 className="h-4 w-4" />,
    color: "blue",
    comingSoon: false,
  },
  schedule: {
    type: "schedule",
    title: "Schedule",
    description: "Run on a cron schedule (e.g. every day or Thursdays at 4pm).",
    icon: <AlarmClock className="h-4 w-4" />,
    color: "amber",
    comingSoon: false,
  },
  integration: {
    type: "integration",
    title: "Integration",
    description: "Start when a connected app event occurs (e.g. Stripe charge).",
    icon: <PlugZap className="h-4 w-4" />,
    color: "violet",
    comingSoon: true,
  },
  form: {
    type: "form",
    title: "Form",
    description: "Trigger when a form is submitted.",
    icon: <FileText className="h-4 w-4" />,
    color: "green",
    comingSoon: true,
  },
};

interface TriggerConfigModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  workflowId: string;
  triggerId: string | null;
}

export function TriggerConfigModal({ open, onOpenChange, workflowId, triggerId }: TriggerConfigModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState<TriggerRecord | null>(null);
  const [type, setType] = useState<TriggerType>("manual");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  // Config fields
  const [webhookSecret, setWebhookSecret] = useState("");
  const [cronExpr, setCronExpr] = useState("");
  const [integrationProvider, setIntegrationProvider] = useState("");
  const [integrationEvent, setIntegrationEvent] = useState("");

  useEffect(() => {
    if (!open || !triggerId) return;
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/workflows/${workflowId}/triggers/${triggerId}`);
        if (!res.ok) throw new Error("Failed to load trigger");
        const tr = (await res.json()) as TriggerRecord;
        if (!mounted) return;
        setRecord(tr);
        setType(tr.trigger_type);
        setName(tr.name || "");
        setDescription((tr.description as string) || "");
        const cfg = (tr.config || {}) as any;
        setWebhookSecret(cfg.webhook_secret || cfg.secret || "");
        setCronExpr(cfg.cron || cfg.cron_expr || "");
        setIntegrationProvider(cfg.provider || "");
        setIntegrationEvent(cfg.event || "");
      } catch (e) {
        console.error(e);
        toast({ title: "Failed to load trigger", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [open, triggerId, workflowId]);

  // Update name when trigger type changes
  useEffect(() => {
    if (record && type !== record.trigger_type) {
      const meta = TRIGGER_META[type];
      if (meta) {
        setName(meta.title);
        setDescription(meta.description);
      }
    }
  }, [type, record]);

  const webhookUrl = useMemo(() => {
    if (!triggerId || !workflowId) return "";
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      if (!origin) return "";
      return `${origin}/api/workflows/${workflowId}/triggers/${triggerId}/invoke`;
    } catch {
      return "";
    }
  }, [triggerId, workflowId]);

  const currentMeta = useMemo(() => TRIGGER_META[type] || TRIGGER_META.manual, [type]);

  const copyToClipboard = async (text: string, type: "url" | "secret") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "url") {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else {
        setCopiedSecret(true);
        setTimeout(() => setCopiedSecret(false), 2000);
      }
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  const onSave = async () => {
    if (!triggerId) return;
    try {
      setSaving(true);
      const cfg: Record<string, unknown> = {};
      if (type === "webhook") {
        cfg.webhook_secret = webhookSecret || crypto.randomUUID?.() || Math.random().toString(36).slice(2);
      }
      if (type === "schedule") {
        cfg.cron = cronExpr;
      }
      if (type === "integration") {
        cfg.provider = integrationProvider;
        cfg.event = integrationEvent;
      }

      const res = await fetch(`/api/workflows/${workflowId}/triggers/${triggerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          trigger_type: type,
          config: cfg,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Trigger updated" });
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Failed to save trigger", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg">Configure Trigger</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center h-[400px] text-sm text-muted-foreground">
              Loading trigger configuration…
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[calc(90vh-120px)]">
            <div className="px-6 pb-6 space-y-5">
              {/* Trigger Type Header */}
              <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg border">
                <div className={`h-10 w-10 rounded-lg grid place-items-center bg-${currentMeta.color}/15 text-${currentMeta.color}-600 dark:text-${currentMeta.color}-400 shrink-0`}>
                  {currentMeta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base">{currentMeta.title}</h3>
                    <Badge variant="secondary" className="uppercase text-[10px]">{type}</Badge>
                    {currentMeta.comingSoon && (
                      <Badge variant="outline" className="text-[10px]">Coming Soon</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{currentMeta.description}</p>
                </div>
              </div>

              <Separator />

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Trigger Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v as TriggerType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">
                          <div className="flex items-center gap-2">
                            <Play className="h-3 w-3" />
                            Manual
                          </div>
                        </SelectItem>
                        <SelectItem value="webhook">
                          <div className="flex items-center gap-2">
                            <Globe2 className="h-3 w-3" />
                            Webhook
                          </div>
                        </SelectItem>
                        <SelectItem value="schedule">
                          <div className="flex items-center gap-2">
                            <AlarmClock className="h-3 w-3" />
                            Schedule
                          </div>
                        </SelectItem>
                        <SelectItem value="integration" disabled>
                          <div className="flex items-center gap-2">
                            <PlugZap className="h-3 w-3" />
                            Integration
                            <Badge variant="outline" className="text-[9px] ml-1">Coming Soon</Badge>
                          </div>
                        </SelectItem>
                        <SelectItem value="form" disabled>
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            Form
                            <Badge variant="outline" className="text-[9px] ml-1">Coming Soon</Badge>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Name</Label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Give your trigger a name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Description</Label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe when this trigger should fire..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Type-specific Configuration */}
              {type === "webhook" && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-sm">Webhook Configuration</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Webhook URL</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={webhookUrl} 
                          readOnly 
                          className="font-mono text-xs bg-background"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(webhookUrl, "url")}
                          className="shrink-0"
                        >
                          {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Secret</Label>
                      <div className="flex gap-2">
                        <Input 
                          value={webhookSecret} 
                          onChange={(e) => setWebhookSecret(e.target.value)} 
                          placeholder="Enter a shared secret (optional)"
                          className="font-mono text-xs"
                        />
                        {webhookSecret && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(webhookSecret, "secret")}
                            className="shrink-0"
                          >
                            {copiedSecret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
                      <p className="font-medium mb-1">How to use:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>Send POST requests to the webhook URL above</li>
                        <li>Include header <code className="text-xs bg-background px-1 py-0.5 rounded">x-webhook-secret</code> with your secret</li>
                        <li>Or add <code className="text-xs bg-background px-1 py-0.5 rounded">?secret=...</code> as a query parameter</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {type === "schedule" && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlarmClock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h4 className="font-semibold text-sm">Schedule Configuration</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cron Expression</Label>
                      <Input 
                        value={cronExpr} 
                        onChange={(e) => setCronExpr(e.target.value)} 
                        placeholder="e.g. 0 16 * * 4 (Thursdays at 4pm)"
                        className="font-mono text-sm"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
                      <p className="font-medium mb-1">Cron syntax examples:</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><code className="text-xs bg-background px-1 py-0.5 rounded">0 9 * * *</code> - Daily at 9:00 AM</li>
                        <li><code className="text-xs bg-background px-1 py-0.5 rounded">0 16 * * 4</code> - Every Thursday at 4:00 PM</li>
                        <li><code className="text-xs bg-background px-1 py-0.5 rounded">*/30 * * * *</code> - Every 30 minutes</li>
                      </ul>
                      <p className="mt-2 text-muted-foreground/80">The platform will schedule this trigger via LangGraph. Ensure your model quota permits periodic runs.</p>
                    </div>
                  </div>
                </div>
              )}

              {type === "integration" && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <PlugZap className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    <h4 className="font-semibold text-sm">Integration Configuration</h4>
                    <Badge variant="outline" className="text-[10px] ml-auto">Coming Soon</Badge>
                  </div>

                  <div className="py-8 text-center space-y-2">
                    <p className="text-sm font-medium">Coming Soon</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Integration triggers are currently under development and will be available in a future release.
                      This will allow you to trigger workflows from connected apps like Stripe, HubSpot, and more.
                    </p>
                  </div>
                </div>
              )}

              {type === "manual" && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Play className="h-4 w-4 text-primary" />
                    <h4 className="font-semibold text-sm">Manual Trigger</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This trigger can be started manually from the UI or via API call. No additional configuration is required.
                  </p>
                </div>
              )}

              {type === "form" && (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-sm">Form Trigger</h4>
                    <Badge variant="outline" className="text-[10px] ml-auto">Coming Soon</Badge>
                  </div>
                  
                  <div className="py-8 text-center space-y-2">
                    <p className="text-sm font-medium">Coming Soon</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Form triggers are currently under development and will be available in a future release.
                      This will allow you to trigger workflows when users submit forms on your website.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)} 
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={onSave} 
                  disabled={saving}
                  className="min-w-[100px]"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}


