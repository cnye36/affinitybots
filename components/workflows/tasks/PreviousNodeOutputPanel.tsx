import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import ReactMarkdown from "react-markdown";
import { ArrowRight } from "lucide-react";
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

type OutputFormat = "json" | "markdown" | "formatted";

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
        // Always return JSON string
        if (typeof data === "string") {
          try {
            // Try to parse and re-stringify to ensure valid JSON
            return JSON.stringify(JSON.parse(data), null, 2);
          } catch {
            return JSON.stringify(data, null, 2);
          }
        }
        return JSON.stringify(data, null, 2);
      case "markdown":
        // Return raw markdown string (not formatted)
        {
          const content = extractMarkdownContent(data);
          if (content !== null) return content;
          return "```json\n" + JSON.stringify(data, null, 2) + "\n```";
        }
      case "formatted":
        // Return content that will be rendered with ReactMarkdown (formatted/nice looking)
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
    <div className="relative overflow-hidden rounded-xl border-2 border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20">
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-r from-emerald-500/5 to-green-500/5">
          <h3 className="font-semibold text-base bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
            Previous Node Output
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Context passed from the upstream task
          </p>
        </div>

        <ScrollArea className="h-[600px]">
          <div className="space-y-4 p-6">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Format</Label>
              <Select
                value={outputFormat}
                onValueChange={(value) => setOutputFormat(value as OutputFormat)}
              >
                <SelectTrigger className="w-[130px] bg-background">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="formatted">Formatted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {data ? (
              outputFormat === "formatted" ? (
                <div className="rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 bg-background p-4 overflow-auto min-h-[400px] max-h-[500px]">
                  <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                    <ReactMarkdown>{formatOutput(data, outputFormat)}</ReactMarkdown>
                  </div>
                </div>
              ) : outputFormat === "json" ? (
                <Textarea
                  value={formatOutput(data, outputFormat)}
                  readOnly
                  className="font-mono text-xs bg-background resize-none border-0 p-0 h-auto min-h-[400px] overflow-auto"
                  style={{ height: "auto" }}
                />
              ) : (
                <Textarea
                  value={formatOutput(data, outputFormat)}
                  readOnly
                  className="font-mono text-xs bg-background resize-none min-h-[400px]"
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/30 to-green-50/30 dark:from-emerald-950/20 dark:to-green-950/20 p-12 min-h-[400px]">
                <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/10 to-green-500/10 mb-4">
                  <ArrowRight className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">No previous output</p>
                <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                  This is the first task in the workflow or the previous task hasn't been executed yet
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
