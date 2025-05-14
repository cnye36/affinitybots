"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import { AgentConfiguration } from "@/types/agent";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeConfigProps {
  config: AgentConfiguration;
  onChange: (field: keyof AgentConfiguration, value: unknown) => void;
  agent_id: string;
}

export function KnowledgeConfig({
  config,
  onChange,
  agent_id,
}: KnowledgeConfigProps) {
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
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/csv",
      "application/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/json",
      "text/markdown",
      "application/xml",
      "text/xml",
    ];

    const invalidFiles = files.filter((file) => {
      // Handle CSV files that might be misidentified
      if (file.name.endsWith(".csv")) {
        return false; // Accept CSV files based on extension
      }
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
        formData.append("agentId", agent_id);

        // Upload and process file
        const response = await fetch("/api/knowledge", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to process ${file.name}`);
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
        `/api/knowledge?agentId=${agent_id}&filename=${encodeURIComponent(
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
    <div className="space-y-6">
      <div className="space-y-4">
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
            accept=".pdf,.txt,.doc,.docx,.csv,.xls,.xlsx,.json,.md,.xml"
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
              Supported formats: PDF, TXT, DOC, DOCX, CSV, XLS, XLSX, JSON, MD,
              XML
            </p>
          </label>
        </div>

        {uploadError && (
          <p className="text-sm text-destructive">{uploadError}</p>
        )}

        <div className="space-y-2">
          {sources.map((source: string, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <span className="text-sm truncate flex-1">{source}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
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
