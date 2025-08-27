import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OutputFormat = "json" | "markdown";

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
        if (typeof data === "string") return data;
        // Prefer structured output if present
        const structured = extractStructuredJson(data);
        if (structured !== null) return JSON.stringify(structured, null, 2);
        // Otherwise show content only
        const contentOnlyForJson = extractMarkdownContent(data);
        return contentOnlyForJson !== null
          ? contentOnlyForJson
          : JSON.stringify(data, null, 2);
      case "markdown":
        if (typeof data === "string") return data;
        const contentOnly = extractMarkdownContent(data);
        return contentOnly !== null
          ? contentOnly
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
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowAdvanced((v) => !v)}
            >
              {showAdvanced ? "Hide Advanced Output" : "Show Advanced Output"}
            </Button>
          </div>
          {outputFormat === "markdown" ? (
            <div className={`prose prose-invert max-w-none ${isStreaming ? "animate-pulse" : ""}`}>
              <ReactMarkdown>
                {formatOutput(testOutput, outputFormat)}
              </ReactMarkdown>
            </div>
          ) : (
            <Textarea
              value={formatOutput(testOutput, outputFormat)}
              readOnly
              className={`font-mono h-[400px] ${
                isStreaming ? "animate-pulse" : ""
              }`}
            />
          )}
          {showAdvanced && (
            <div className="space-y-2 pt-2">
              <Label>Advanced Output (raw response)</Label>
              <Textarea
                value={typeof testOutput === "string" ? testOutput : JSON.stringify(testOutput, null, 2)}
                readOnly
                className="font-mono h-[300px]"
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
