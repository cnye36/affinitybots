import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskOutput {
  result: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

type OutputFormat = "json" | "markdown" | "text";

interface PreviousNodeOutputPanelProps {
  data: TaskOutput | null;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
}

const formatOutput = (
  data: TaskOutput | null,
  outputFormat: OutputFormat
): string => {
  if (!data) return "No data available";

  try {
    switch (outputFormat) {
      case "json":
        return typeof data === "string" ? data : JSON.stringify(data, null, 2);
      case "markdown":
        return typeof data === "string"
          ? data
          : "```json\n" + JSON.stringify(data, null, 2) + "\n```";
      case "text":
        return typeof data === "string"
          ? data
          : JSON.stringify(data, undefined, 2);
      default:
        return String(data);
    }
  } catch {
    return "Error formatting output";
  }
};

export function PreviousNodeOutputPanel({
  data,
  outputFormat,
  setOutputFormat,
}: PreviousNodeOutputPanelProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-4">Previous Node Output</h3>
      <ScrollArea className="h-[600px]">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label>Output</Label>
            <Select
              value={outputFormat}
              onValueChange={(value) => setOutputFormat(value as OutputFormat)}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            value={formatOutput(data, outputFormat)}
            readOnly
            className="font-mono h-[400px]"
          />
        </div>
      </ScrollArea>
    </div>
  );
}
