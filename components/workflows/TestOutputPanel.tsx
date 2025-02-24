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

type OutputFormat = "json" | "markdown" | "text";

type TestOutput = {
  type?: string;
  content?: string;
  result?: unknown;
  error?: string;
};

interface TestOutputPanelProps {
  testOutput: TestOutput | null;
  outputFormat: OutputFormat;
  setOutputFormat: (format: OutputFormat) => void;
  isStreaming: boolean;
}

const formatOutput = (
  data: TestOutput | null,
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

export function TestOutputPanel({
  testOutput,
  outputFormat,
  setOutputFormat,
  isStreaming,
}: TestOutputPanelProps) {
  return (
    <div className="border rounded-lg p-4">
      <h3 className="font-medium mb-4">Test Output</h3>
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
            value={formatOutput(testOutput, outputFormat)}
            readOnly
            className={`font-mono h-[400px] ${
              isStreaming ? "animate-pulse" : ""
            }`}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
