import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OutputFormat = "json" | "markdown" | "formatted";

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
    const extractMarkdownContent = (payload: TestOutput): string | null => {
      if (typeof payload.content === "string" && payload.content.trim().length > 0) {
        return payload.content;
      }

      const result: unknown = payload.result;
      if (!result) return null;

      if (typeof result === "string" && result.trim().length > 0) {
        return result;
      }

      if (Array.isArray(result)) {
        const first = result[0] as any;
        if (first && typeof first.content === "string") {
          return first.content as string;
        }
      }

      if (typeof result === "object" && result !== null) {
        const maybeContent = (result as any).content;
        if (typeof maybeContent === "string") {
          return maybeContent as string;
        }
      }

      return null;
    };

    const extractStructuredJson = (payload: TestOutput): unknown | null => {
      const result = payload.result as any;
      if (result && typeof result === "object") {
        if ("output" in result) {
          return (result as any).output;
        }
        if ("content" in result && typeof result.content === "string") {
          try {
            return JSON.parse(result.content);
          } catch {
            // fallthrough to return content string below
          }
        }
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
        if (typeof data === "string") return data;
        const contentOnly = extractMarkdownContent(data);
        return contentOnly !== null
          ? contentOnly
          : "```json\n" + JSON.stringify(data, null, 2) + "\n```";
      case "formatted":
        // Return content that will be rendered with ReactMarkdown (formatted/nice looking)
        if (typeof data === "string") return data;
        const formattedContent = extractMarkdownContent(data);
        return formattedContent !== null
          ? formattedContent
          : "```json\n" + JSON.stringify(data, null, 2) + "\n```";
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
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-blue-200/50 dark:border-blue-800/30 bg-gradient-to-r from-blue-500/5 to-cyan-500/5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                Test Output
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Live results from your agent execution
              </p>
            </div>
            {isStreaming && (
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs font-medium">Streaming...</span>
              </div>
            )}
          </div>
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

          {testOutput ? (
            <>
              {outputFormat === "formatted" ? (
                <div className="relative rounded-lg border border-blue-200/50 dark:border-blue-800/50 bg-background p-4 overflow-auto min-h-[400px] max-h-[450px]">
                  <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
                    <ReactMarkdown>
                      {formatOutput(testOutput, outputFormat)}
                    </ReactMarkdown>
                  </div>
                </div>
              ) : outputFormat === "json" ? (
                <Textarea
                  value={formatOutput(testOutput, outputFormat)}
                  readOnly
                  className="font-mono text-xs bg-background resize-none border-0 p-0 h-auto min-h-[400px] overflow-auto"
                  style={{ height: "auto" }}
                />
              ) : (
                <Textarea
                  value={formatOutput(testOutput, outputFormat)}
                  readOnly
                  className="font-mono text-xs bg-background resize-none min-h-[400px]"
                />
              )}

              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-xs"
                >
                  {showAdvanced ? "Hide Raw Response" : "Show Raw Response"}
                </Button>
              </div>

              {showAdvanced && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Raw Response</Label>
                  <Textarea
                    value={typeof testOutput === "string" ? testOutput : JSON.stringify(testOutput, null, 2)}
                    readOnly
                    className="font-mono text-xs bg-background/50 resize-none h-[300px]"
                  />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20 p-12 min-h-[400px]">
              <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mb-4">
                <Play className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">No test results yet</p>
              <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                Click the Test button above to run your agent and see the output here
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      </div>
    </div>
  );
}
