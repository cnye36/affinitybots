"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import { AssistantConfiguration } from "@/types/assistant";
import { useState } from "react";
import { useToast } from "@/hooks/useToast";

interface KnowledgeConfigProps {
  config: AssistantConfiguration;
  onChange: (field: keyof AssistantConfiguration, value: unknown) => void;
  assistant_id: string;
}

export function KnowledgeConfig({ config, onChange, assistant_id }: KnowledgeConfigProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setUploadError(null);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    const allowedFileTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
      "text/markdown",
      "application/xml",
      "text/xml",
      "text/html",
    ];

    const invalidFiles = files.filter((file) => {
      // Handle files that might be misidentified
      if (file.name.endsWith(".csv") || file.name.endsWith(".docx") || file.name.endsWith(".html") || file.name.endsWith(".htm")) {
        return false;
      }
      // Block common code files even if text/plain
      const blocked = [
        ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs",
        ".php", ".rb", ".c", ".cpp", ".h", ".hpp", ".cs", ".sh",
        ".bash", ".zsh", ".swift", ".kt", ".scala", ".sql", ".r",
      ];
      const ext = file.name.slice(file.name.lastIndexOf('.'));
      if (blocked.includes(ext)) return true;
      return !allowedFileTypes.includes(file.type);
    });

    if (invalidFiles.length > 0) {
      setUploadError(
        `Only PDF, TXT, DOC/DOCX, CSV, XLS/XLSX, JSON, MD, and XML files are supported. Invalid files: ${invalidFiles
          .map((f) => f.name)
          .join(", ")}`
      );
      return;
    }

    try {
      setUploadError(null);

      // Process each file
      for (const file of files) {
        toast({
          title: "Processing File",
          description: `Processing ${file.name}...`,
        });

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assistantId", assistant_id);

        // Upload and process file
        const response = await fetch("/api/knowledge", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          let detail = `Failed to process ${file.name}`;
          try {
            const data = await response.json();
            if (data?.error) detail = data.error;
          } catch {}
          throw new Error(detail);
        }

        toast({
          title: "Success",
          description: `Successfully processed ${file.name}`,
          variant: "default",
        });
      }

      // Update the UI
      const currentSources =
        (config.knowledge_base?.config?.sources as string[]) || [];
      const newSources = [...currentSources, ...files.map((file) => file.name)];

      onChange("knowledge_base", {
        isEnabled: true,
        config: {
          sources: newSources,
        },
      });
    } catch (error) {
      console.error("Error processing files:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setUploadError(`Error processing files: ${errorMessage}`);
      toast({
        title: "Error",
        description: "Failed to process files",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSource = async (index: number) => {
    const currentSources =
      (config.knowledge_base?.config?.sources as string[]) || [];
    const sourceToRemove = currentSources[index];

    try {
      // Delete document embeddings from the database
      const response = await fetch(
        `/api/knowledge?assistantId=${assistant_id}&filename=${encodeURIComponent(
          sourceToRemove
        )}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete ${sourceToRemove} from database`);
      }

      toast({
        title: "Success",
        description: `Successfully removed ${sourceToRemove}`,
        variant: "default",
      });

      // Update the UI
      const newSources = currentSources.filter((_, i) => i !== index);
      onChange("knowledge_base", {
        isEnabled: newSources.length > 0,
        config: {
          sources: newSources,
        },
      });
    } catch (error) {
      console.error("Error removing document:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to remove document: ${errorMessage}`,
        variant: "destructive",
      });
    }
  };

  const sources = (config.knowledge_base?.config?.sources as string[]) || [];

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div className="space-y-4 w-full overflow-hidden">
        <div>
          <Label>Knowledge Sources</Label>
          <p className="text-sm text-muted-foreground">
            Upload documents (PDF, TXT, DOC, DOCX) to use as knowledge sources
          </p>
        </div>

        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            }
            hover:border-primary hover:bg-primary/5
          `}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.txt,.docx,.csv,.xls,.xlsx,.json,.md,.xml,.html,.htm"
            className="hidden"
            multiple
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>
              {isDragging
                ? "Drop files here..."
                : "Drag and drop files here, or click to select"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supported: PDF, DOCX, TXT, CSV, XLS/XLSX, JSON, MD, XML, HTML
            </p>
          </label>
        </div>

        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}

        <div className="space-y-2 w-full overflow-hidden">
          {sources.map((source: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 p-2 bg-muted rounded-md w-full overflow-hidden"
            >
              <span className="text-sm truncate flex-1 min-w-0">{source}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => handleRemoveSource(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
