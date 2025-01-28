"use client"

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

interface Tool {
  name: string;
  description: string;
  type: string;
  config: Record<string, string | number | boolean>;
}

interface ToolSelectorProps {
  selectedTools: Tool[];
  onToolsChange: (tools: Tool[]) => void;
}

// Define available tools with proper typing
const AVAILABLE_TOOLS: Tool[] = [
  {
    name: "Web Search",
    description: "Search the web for information",
    type: "web_search",
    config: {
      maxResults: 3,
    },
  },
  {
    name: "Calculator",
    description: "Perform calculations",
    type: "calculator",
    config: {},
  },
  {
    name: "Wikipedia",
    description: "Search Wikipedia articles",
    type: "wikipedia",
    config: {
      maxResults: 2,
    },
  },
];

export function ToolSelector({
  selectedTools,
  onToolsChange,
}: ToolSelectorProps) {
  const [selectedTool, setSelectedTool] = useState<string>("");

  const handleAddTool = () => {
    if (!selectedTool) return;
    const tool = AVAILABLE_TOOLS.find((t) => t.type === selectedTool);
    if (!tool) return;

    // Only add if not already selected
    if (!selectedTools.some((t) => t.type === tool.type)) {
      onToolsChange([...selectedTools, tool]);
    }
    setSelectedTool("");
  };

  const handleRemoveTool = (toolType: string) => {
    onToolsChange(selectedTools.filter((t) => t.type !== toolType));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedTool} onValueChange={setSelectedTool}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a tool" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABLE_TOOLS.filter(
              (tool) => !selectedTools.some((t) => t.type === tool.type)
            ).map((tool) => (
              <SelectItem key={tool.type} value={tool.type}>
                {tool.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAddTool}
          disabled={!selectedTool}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {selectedTools.map((tool) => (
          <div
            key={tool.type}
            className="flex items-center justify-between p-2 bg-muted rounded-md"
          >
            <div>
              <div className="font-medium">{tool.name}</div>
              <div className="text-sm text-muted-foreground">
                {tool.description}
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveTool(tool.type)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
