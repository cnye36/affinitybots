"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Settings, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, any>;
  description?: string;
}

interface ToolCallApprovalProps {
  toolCalls: ToolCall[];
  onApprove: (toolCallId: string, alwaysAllow?: boolean) => void;
  onDeny: (toolCallId: string) => void;
  onApproveAll: (alwaysAllow?: boolean) => void;
  onDenyAll: () => void;
  className?: string;
}

export default function ToolCallApproval({
  toolCalls,
  onApprove,
  onDeny,
  onApproveAll,
  onDenyAll,
  className,
}: ToolCallApprovalProps) {
  const [alwaysAllowStates, setAlwaysAllowStates] = useState<Record<string, boolean>>({});
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const handleApprove = (toolCallId: string) => {
    onApprove(toolCallId, alwaysAllowStates[toolCallId]);
  };

  const handleApproveAll = () => {
    const hasAnyAlwaysAllow = Object.values(alwaysAllowStates).some(val => val);
    onApproveAll(hasAnyAlwaysAllow);
  };

  const toggleAlwaysAllow = (toolCallId: string) => {
    setAlwaysAllowStates(prev => ({
      ...prev,
      [toolCallId]: !prev[toolCallId]
    }));
  };

  const toggleDetails = (toolCallId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [toolCallId]: !prev[toolCallId]
    }));
  };

  if (!toolCalls.length) return null;

  return (
    <div className={cn("max-w-[85%] ml-12 mt-2 mb-4", className)}>
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Tool Approval Required
          </span>
        </div>
        
        {/* Compact tool list */}
        <div className="space-y-2 mb-3">
          {toolCalls.map((toolCall, index) => (
            <div key={toolCall.id} className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs px-2 py-1">
                  {toolCall.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleDetails(toolCall.id)}
                  className="h-5 px-2 text-xs"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
              
              {/* Quick action buttons */}
              <div className="flex gap-1">
                <Button
                  onClick={() => handleApprove(toolCall.id)}
                  className="h-6 px-3 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  onClick={() => onDeny(toolCall.id)}
                  variant="destructive"
                  className="h-6 px-3"
                  size="sm"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          {/* Details panel */}
          {Object.entries(showDetails).some(([_, show]) => show) && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-xs">
              {toolCalls.map((toolCall) => 
                showDetails[toolCall.id] && (
                  <div key={`details-${toolCall.id}`} className="mb-2 last:mb-0">
                    <strong className="block mb-1">{toolCall.name} Parameters:</strong>
                    <pre className="whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                      {JSON.stringify(toolCall.args, null, 2)}
                    </pre>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Main action buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleApproveAll}
            className="flex-1 bg-green-600 hover:bg-green-700 h-8"
            size="sm"
          >
            <Check className="h-3 w-3 mr-1" />
            Approve All
          </Button>
          <Button
            onClick={onDenyAll}
            variant="destructive"
            className="flex-1 h-8"
            size="sm"
          >
            <X className="h-3 w-3 mr-1" />
            Deny All
          </Button>
        </div>
        
        {/* Always allow option */}
        <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-700">
          <label className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300 cursor-pointer">
            <input
              type="checkbox"
              checked={Object.values(alwaysAllowStates).some(val => val)}
              onChange={() => {
                const newState = !Object.values(alwaysAllowStates).some(val => val);
                const updates: Record<string, boolean> = {};
                toolCalls.forEach(tc => updates[tc.id] = newState);
                setAlwaysAllowStates(updates);
              }}
              className="rounded text-xs"
            />
            Always allow these tools
          </label>
        </div>
      </div>
    </div>
  );
}