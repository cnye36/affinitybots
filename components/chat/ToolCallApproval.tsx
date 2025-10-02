"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
  description?: string;
}

interface ToolCallApprovalProps {
  toolCalls: ToolCall[];
  rememberedTools: Record<string, boolean>;
  onRememberChange: (toolName: string, enabled: boolean) => void;
  onApprove: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export default function ToolCallApproval({
  toolCalls,
  rememberedTools,
  onRememberChange,
  onApprove,
  isSubmitting = false,
  className,
}: ToolCallApprovalProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!toolCalls.length) return null;

  return (
    <Card className={cn("border-amber-300/70 bg-amber-50/80 dark:border-amber-800/60 dark:bg-amber-950/30", className)}>
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
          Tool approval required
        </CardTitle>
        <p className="text-xs text-amber-800/80 dark:text-amber-200/90">
          The assistant wants to call the following tools. Review the details or mark trusted tools to auto-approve them for this chat.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {toolCalls.map(toolCall => {
            const isRemembered = rememberedTools[toolCall.name] ?? false;
            const showDetails = expanded[toolCall.id];
            return (
              <div
                key={toolCall.id}
                className="rounded-lg border border-amber-200/80 bg-white/70 p-3 shadow-sm dark:border-amber-800/60 dark:bg-amber-900/40"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-1 items-start gap-3">
                    <Badge variant="secondary" className="bg-amber-100 text-amber-900 dark:bg-amber-800/60 dark:text-amber-100">
                      {toolCall.name}
                    </Badge>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {toolCall.description ? (
                        <p className="text-foreground/80 dark:text-amber-50/90">{toolCall.description}</p>
                      ) : (
                        <p className="text-foreground/70 dark:text-amber-100/70">No description provided</p>
                      )}
                      <button
                        type="button"
                        className="flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-900 dark:text-amber-200"
                        onClick={() =>
                          setExpanded(prev => ({
                            ...prev,
                            [toolCall.id]: !showDetails,
                          }))
                        }
                      >
                        {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showDetails ? "Hide parameters" : "View parameters"}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border border-amber-200/70 bg-amber-100/60 px-2 py-1 text-xs font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-900/60 dark:text-amber-100">
                    <Switch
                      id={`remember-${toolCall.id}`}
                      checked={isRemembered}
                      onCheckedChange={checked => onRememberChange(toolCall.name, checked)}
                    />
                    <label htmlFor={`remember-${toolCall.id}`} className="cursor-pointer select-none">
                      Always approve in this chat
                    </label>
                  </div>
                </div>
                {showDetails && (
                  <div className="mt-3 rounded-md border border-dashed border-amber-200/80 bg-white/70 p-3 text-[11px] font-mono text-foreground/80 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
                    <pre className="max-h-48 overflow-auto whitespace-pre-wrap">
                      {JSON.stringify(toolCall.args, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-amber-200/70 bg-white/70 p-3 text-xs text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
          <p>
            Need to see what happens? Approve manually to run the tool this time. If the tool is part of an automated workflow, keep auto-approve on so runs never stall.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={onApprove}
            disabled={isSubmitting}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Play className="mr-2 h-4 w-4" />
            {isSubmitting ? "Approving..." : "Run approved tools"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}