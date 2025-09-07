import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
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

type OutputFormat = "json" | "markdown";

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
    const extractMarkdownContent = (payload: TaskOutput): string | null => {
      // Common cases: string content nestled in result
      const res: any = payload.result ?? payload;
      if (typeof res === "string" && res.trim().length > 0) return res;
      if (res && typeof res === "object") {
        if (typeof res.content === "string" && res.content.trim().length > 0) return res.content as string;
        if (Array.isArray(res) && res[0]?.content) return String(res[0].content);
        if (typeof res.output === "string") return res.output;
      }
      return null;
    };

    switch (outputFormat) {
      case "json":
        return typeof data === "string" ? data : JSON.stringify(data, null, 2);
      case "markdown":
        {
          const content = extractMarkdownContent(data);
          if (content !== null) return content;
          return "```json\n" + JSON.stringify(data, null, 2) + "\n```";
        }
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
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="markdown">Markdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {outputFormat === "markdown" ? (
            <div className="h-[400px] border rounded-md p-3 overflow-auto">
              <div className="prose max-w-none text-foreground dark:prose-invert">
                <ReactMarkdown>{formatOutput(data, outputFormat)}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <Textarea
              value={formatOutput(data, outputFormat)}
              readOnly
              className="font-mono h-[400px]"
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
