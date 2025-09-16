"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { TriggerType } from "@/types/workflow";

type TriggerRecord = {
  trigger_id: string;
  workflow_id: string;
  name: string;
  description?: string | null;
  trigger_type: TriggerType;
  config: Record<string, unknown> | null;
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
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Configure Trigger</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as TriggerType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                    <SelectItem value="schedule">Schedule</SelectItem>
                    <SelectItem value="integration">Integration</SelectItem>
                    <SelectItem value="form">Form</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            {type === "webhook" && (
              <div className="space-y-3 border rounded-md p-3">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input value={webhookUrl} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Secret</Label>
                  <Input value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} placeholder="Provide a shared secret" />
                </div>
                <div className="text-xs text-muted-foreground">
                  Send POST requests with header <code>x-webhook-secret</code> set to the secret, or include <code>?secret=…</code> as a query parameter.
                </div>
              </div>
            )}

            {type === "schedule" && (
              <div className="space-y-3 border rounded-md p-3">
                <div className="space-y-2">
                  <Label>Cron Expression</Label>
                  <Input value={cronExpr} onChange={(e) => setCronExpr(e.target.value)} placeholder="e.g. 0 16 * * 4 (Thurs at 4pm)" />
                </div>
                <div className="text-xs text-muted-foreground">
                  The platform will schedule this trigger via LangGraph. Ensure your model quota permits periodic runs.
                </div>
              </div>
            )}

            {type === "integration" && (
              <div className="space-y-3 border rounded-md p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Input value={integrationProvider} onChange={(e) => setIntegrationProvider(e.target.value)} placeholder="e.g. stripe, hubspot, sheets" />
                  </div>
                  <div className="space-y-2">
                    <Label>Event</Label>
                    <Input value={integrationEvent} onChange={(e) => setIntegrationEvent(e.target.value)} placeholder="e.g. charge.succeeded, row.created" />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Configure the provider to POST to your integration intake endpoint once available.
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


