"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import { AgentConfigurableOptions } from "@/types/index";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface KnowledgeConfigProps {
  config: AgentConfigurableOptions;
  onChange: (field: keyof AgentConfigurableOptions, value: unknown) => void;
}

export function KnowledgeConfig({ config, onChange }: KnowledgeConfigProps) {
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
    const invalidFiles = files.filter(
      file => !['application/pdf', 'text/plain', 'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        .includes(file.type)
    );

    if (invalidFiles.length > 0) {
      setUploadError("Only PDF, TXT, and DOC/DOCX files are supported");
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
        formData.append("assistantId", config.owner_id);

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
      const currentSources = (config.tools.knowledge_base?.config.sources as string[]) || [];
      const newSources = [...currentSources, ...files.map(file => file.name)];

      onChange("tools", {
        ...config.tools,
        knowledge_base: {
          isEnabled: true,
          config: {
            sources: newSources,
          },
        },
      });
    } catch (error) {
      console.error('Error processing files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setUploadError(`Error processing files: ${errorMessage}`);
      toast({
        title: "Error",
        description: "Failed to process files",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSource = (index: number) => {
    const currentSources = (config.tools.knowledge_base?.config.sources as string[]) || [];
    const currentFiles = (config.tools.knowledge_base?.config.files as File[]) || [];
    
    const newSources = currentSources.filter((_, i) => i !== index);
    const newFiles = currentFiles.filter((_, i) => i !== index);

    onChange("tools", {
      ...config.tools,
      knowledge_base: {
        isEnabled: newSources.length > 0,
        config: {
          sources: newSources,
          files: newFiles,
        },
      },
    });
  };

  const sources = (config.tools.knowledge_base?.config.sources as string[]) || [];

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
            ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            hover:border-primary hover:bg-primary/5
          `}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            multiple
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p>{isDragging ? 'Drop files here...' : 'Drag and drop files here, or click to select'}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Supported formats: PDF, TXT, DOC, DOCX
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
