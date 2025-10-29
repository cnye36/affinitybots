"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Check, X } from "lucide-react";

interface ToolCall {
  name: string;
  args: Record<string, any>;
  id: string;
}

interface ToolApprovalModalProps {
  isOpen: boolean;
  toolCalls: ToolCall[];
  onApprove: (approvedTools: ToolCall[]) => void;
  onDeny: () => void;
  onApproveAlways: (approvedTools: ToolCall[]) => void;
}

export function ToolApprovalModal({
  isOpen,
  toolCalls,
  onApprove,
  onDeny,
  onApproveAlways,
}: ToolApprovalModalProps) {
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(toolCalls.map(tc => tc.id)));
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen || !toolCalls.length) return null;

  const handleToolToggle = (toolId: string) => {
    const newSelected = new Set(selectedTools);
    if (newSelected.has(toolId)) {
      newSelected.delete(toolId);
    } else {
      newSelected.add(toolId);
    }
    setSelectedTools(newSelected);
  };

  const handleApprove = () => {
    const approvedTools = toolCalls.filter(tc => selectedTools.has(tc.id));
    onApprove(approvedTools);
  };

  const handleApproveAlways = () => {
    const approvedTools = toolCalls.filter(tc => selectedTools.has(tc.id));
    onApproveAlways(approvedTools);
  };

  const handleDeny = () => {
    onDeny();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Tool Approval Required</CardTitle>
          </div>
          <CardDescription>
            The assistant wants to use the following tools. Please review and approve the ones you want to allow.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {toolCalls.map((toolCall) => (
            <div key={toolCall.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={toolCall.id}
                    checked={selectedTools.has(toolCall.id)}
                    onCheckedChange={() => handleToolToggle(toolCall.id)}
                  />
                  <label htmlFor={toolCall.id} className="font-medium cursor-pointer">
                    {toolCall.name}
                  </label>
                </div>
                <Badge variant="secondary">
                  {Object.keys(toolCall.args).length} parameters
                </Badge>
              </div>
              
              {Object.keys(toolCall.args).length > 0 && (
                <div className="ml-6 space-y-2">
                  <div className="text-sm text-muted-foreground">Parameters:</div>
                  <div className="bg-muted/50 rounded p-3 space-y-1">
                    {Object.entries(toolCall.args).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{key}:</span>{" "}
                        <span className="text-muted-foreground">
                          {typeof value === "string" ? value : JSON.stringify(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
        
        <div className="border-t p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberChoice}
              onCheckedChange={(checked) => setRememberChoice(checked === true)}
            />
            <label htmlFor="remember" className="text-sm text-muted-foreground">
              Remember this choice for similar tools
            </label>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleDeny}>
              <X className="h-4 w-4 mr-2" />
              Deny All
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={selectedTools.size === 0}
            >
              <Check className="h-4 w-4 mr-2" />
              Approve Selected ({selectedTools.size})
            </Button>
            {rememberChoice && (
              <Button 
                variant="default"
                onClick={handleApproveAlways}
                disabled={selectedTools.size === 0}
              >
                <Check className="h-4 w-4 mr-2" />
                Approve Always
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
