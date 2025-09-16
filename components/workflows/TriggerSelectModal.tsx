"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlarmClock, Globe2, Play, PlugZap } from "lucide-react";
import { TriggerType } from "@/types/workflow";

type TriggerOption = {
  type: TriggerType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string; // tailwind hue for icon bg
};

const TRIGGER_OPTIONS: TriggerOption[] = [
  {
    type: "manual",
    title: "Manual",
    description: "Start this workflow manually from the UI or API.",
    icon: <Play className="h-4 w-4" />,
  color: "primary",
  },
  {
    type: "webhook",
    title: "Webhook",
    description: "Trigger when an authenticated HTTP request is received.",
    icon: <Globe2 className="h-4 w-4" />,
    color: "blue",
  },
  {
    type: "schedule",
    title: "Schedule",
    description: "Run on a cron schedule (e.g. every day or Thursdays at 4pm).",
    icon: <AlarmClock className="h-4 w-4" />,
    color: "amber",
  },
  {
    type: "integration",
    title: "Integration",
    description: "Start when a connected app event occurs (e.g. Stripe charge).",
    icon: <PlugZap className="h-4 w-4" />,
    color: "violet",
  },
];

export interface CreateTriggerPayload {
  trigger_type: TriggerType;
  name: string;
  description?: string;
  config: Record<string, unknown>;
}

interface TriggerSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: CreateTriggerPayload) => Promise<void> | void;
}

export function TriggerSelectModal({ isOpen, onClose, onCreate }: TriggerSelectModalProps) {
  const [selected, setSelected] = useState<TriggerType | null>("manual");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("Entrypoint");
  const [description, setDescription] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [cronExpr, setCronExpr] = useState("");
  const [provider, setProvider] = useState("");
  const [event, setEvent] = useState("");

  const current = useMemo(() => TRIGGER_OPTIONS.find((o) => o.type === selected) || null, [selected]);

  const reset = () => {
    setSelected(null);
    setSaving(false);
    setName("Entrypoint");
    setDescription("");
    setWebhookSecret("");
    setCronExpr("");
    setProvider("");
    setEvent("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isCreateDisabled = useMemo(() => {
    if (!selected) return true;
    if (selected === "schedule") return !cronExpr.trim();
    if (selected === "integration") return !provider.trim() || !event.trim();
    return false;
  }, [selected, cronExpr, provider, event]);

  const handleCreate = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const cfg: Record<string, unknown> = {};
      if (selected === "webhook") {
        cfg.webhook_secret = webhookSecret || globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
      }
      if (selected === "schedule") {
        cfg.cron = cronExpr;
      }
      if (selected === "integration") {
        cfg.provider = provider;
        cfg.event = event;
      }
      await onCreate({ trigger_type: selected, name: name || current?.title || "Entrypoint", description, config: cfg });
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => (v ? undefined : handleClose())}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden">
        <div className="grid grid-cols-12">
          {/* Left: selection list */}
          <div className="col-span-5 border-r bg-muted/40">
            <div className="p-4 pb-2">
              <DialogHeader>
                <DialogTitle className="text-lg">Select a Trigger</DialogTitle>
              </DialogHeader>
            </div>
            <ScrollArea className="h-[520px] px-3 pb-3">
              <div className="space-y-2">
                {TRIGGER_OPTIONS.map((opt) => {
                  const isActive = selected === opt.type;
                  return (
                    <button
                      key={opt.type}
                      onClick={() => {
                        setSelected(opt.type);
                        setName(opt.title);
                        setDescription(opt.description);
                      }}
                      className={`w-full text-left rounded-md border p-3 transition-all ${
                        isActive
                          ? "bg-background ring-1 ring-primary/60 shadow-sm"
                          : "bg-background/60 hover:bg-background"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-md grid place-items-center bg-${opt.color}/15 text-${opt.color}-600 dark:text-${opt.color}-400`}>
                          {opt.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{opt.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-2">{opt.description}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Right: details */}
          <div className="col-span-7">
            <div className="p-5 space-y-4">
              {current ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg grid place-items-center bg-${current.color}/15 text-${current.color}-600 dark:text-${current.color}-400`}>{current.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold leading-none">{current.title}</h3>
                        <Badge variant="secondary" className="uppercase text-[10px]">{selected}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{current.description}</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Title</Label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                  </div>

                  {selected === "webhook" && (
                    <div className="space-y-2 border rounded-md p-3">
                      <Label>Secret</Label>
                      <Input
                        placeholder="Provide a shared secret (optional)"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">Use header x-webhook-secret or a secret= query param.</div>
                    </div>
                  )}

                  {selected === "schedule" && (
                    <div className="space-y-2 border rounded-md p-3">
                      <Label>Cron Expression</Label>
                      <Input
                        placeholder="e.g. 0 16 * * 4 (Thurs at 4pm)"
                        value={cronExpr}
                        onChange={(e) => setCronExpr(e.target.value)}
                      />
                      <div className="text-xs text-muted-foreground">This schedule will be managed via LangGraph Platform.</div>
                    </div>
                  )}

                  {selected === "integration" && (
                    <div className="space-y-2 border rounded-md p-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Provider</Label>
                          <Input placeholder="e.g. stripe, hubspot, sheets" value={provider} onChange={(e) => setProvider(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Event</Label>
                          <Input placeholder="e.g. charge.succeeded, row.created" value={event} onChange={(e) => setEvent(e.target.value)} />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">Providers should POST to /api/integrations/events with provider, event, and data.</div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={saving || isCreateDisabled}>{saving ? "Creating…" : "Create Trigger"}</Button>
                  </div>
                </>
              ) : (
                <div className="h-[520px] grid place-items-center text-sm text-muted-foreground">Choose a trigger to configure.</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


