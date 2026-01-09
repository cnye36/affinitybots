"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { X, Upload, Globe, Loader2, FileText, ExternalLink, Clock } from "lucide-react";
import { AssistantConfiguration } from "@/types/assistant";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface KnowledgeConfigProps {
  config: AssistantConfiguration;
  onChange: (field: keyof AssistantConfiguration, value: unknown) => void;
  assistant_id: string;
}

interface IndexedURL {
  url: string;
  pageCount: number;
  indexedAt: string;
  title?: string;
}

export function KnowledgeConfig({ config, onChange, assistant_id }: KnowledgeConfigProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  // URL indexing state
  const [url, setUrl] = useState("");
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexedUrls, setIndexedUrls] = useState<IndexedURL[]>([]);
  const [urlsLoading, setUrlsLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [limits, setLimits] = useState<{ currentCount: number; limit: number } | null>(null);

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

  // Fetch indexed URLs on mount
  useEffect(() => {
    if (assistant_id) {
      fetchIndexedUrls();
    }
  }, [assistant_id]);

  const fetchIndexedUrls = async () => {
    setUrlsLoading(true);
    try {
      const response = await fetch(`/api/knowledge/url?assistantId=${assistant_id}`);
      const data = await response.json();
      if (response.ok) {
        setIndexedUrls(data.urls || []);
        setLimits({ currentCount: data.currentCount, limit: data.limit });
      }
    } catch (error) {
      console.error("Error fetching URLs:", error);
    } finally {
      setUrlsLoading(false);
    }
  };

  const handleIndexUrl = async () => {
    if (!url.trim()) {
      setUrlError("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setUrlError("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setIsIndexing(true);
    setUrlError(null);

    try {
      const response = await fetch("/api/knowledge/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, assistantId: assistant_id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to index URL");
      }

      toast({
        title: "Success!",
        description: `Indexed ${data.stats.pagesIndexed} pages from ${url}`,
        variant: "default"
      });

      setUrl("");
      await fetchIndexedUrls(); // Refresh list

      // Update the knowledge_base config to mark as enabled
      onChange("knowledge_base", {
        isEnabled: true,
        config: config.knowledge_base?.config || { sources: [] }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setUrlError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsIndexing(false);
    }
  };

  const handleRemoveUrl = async (urlToRemove: string) => {
    try {
      const response = await fetch(
        `/api/knowledge/url?assistantId=${assistant_id}&url=${encodeURIComponent(urlToRemove)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to remove URL");
      }

      toast({
        title: "Success",
        description: "URL removed successfully",
        variant: "default"
      });

      await fetchIndexedUrls(); // Refresh list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Error",
        description: `Failed to remove URL: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const sources = (config.knowledge_base?.config?.sources as string[]) || [];

  return (
    <div className="space-y-6 w-full overflow-hidden">
      <div>
        <Label>Knowledge Base</Label>
        <p className="text-sm text-muted-foreground">
          Add documents and websites to your agent's knowledge
        </p>
      </div>

      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
            {sources.length > 0 && (
              <Badge variant="secondary" className="ml-1">{sources.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="websites" className="gap-2">
            <Globe className="h-4 w-4" />
            Websites
            {indexedUrls.length > 0 && (
              <Badge variant="secondary" className="ml-1">{indexedUrls.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4 mt-4">
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
              <p className="font-medium">
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
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{uploadError}</p>
            </div>
          )}

          {sources.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2 w-full overflow-hidden">
              {sources.map((source: string, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 p-3 bg-muted rounded-lg border border-border w-full overflow-hidden hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate flex-1 min-w-0">{source}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveSource(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="websites" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Enter website URL (e.g., https://example.com)"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setUrlError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isIndexing) {
                      handleIndexUrl();
                    }
                  }}
                  className="pl-10"
                  disabled={isIndexing}
                />
              </div>
              <Button
                onClick={handleIndexUrl}
                disabled={isIndexing || !url.trim()}
                className="gap-2 min-w-[120px]"
              >
                {isIndexing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4" />
                    Index URL
                  </>
                )}
              </Button>
            </div>

            {limits && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  URLs indexed: {limits.currentCount} / {limits.limit === Infinity ? "Unlimited" : limits.limit}
                </span>
                {limits.limit !== Infinity && limits.currentCount >= limits.limit && (
                  <Badge variant="destructive">Limit Reached</Badge>
                )}
              </div>
            )}

            {urlError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{urlError}</p>
              </div>
            )}

            {isIndexing && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Crawling website...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This may take a minute depending on the site size
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {urlsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : indexedUrls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No websites indexed yet</p>
              <p className="text-xs mt-1">Enter a URL above to start indexing</p>
            </div>
          ) : (
            <div className="space-y-2 w-full overflow-hidden">
              {indexedUrls.map((indexedUrl, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 p-3 bg-muted rounded-lg border border-border w-full overflow-hidden hover:bg-muted/80 transition-colors"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Globe className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={indexedUrl.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium hover:underline truncate flex-1 min-w-0 flex items-center gap-1"
                        >
                          {indexedUrl.title || new URL(indexedUrl.url).hostname}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {indexedUrl.pageCount} pages
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(indexedUrl.indexedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {indexedUrl.url}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveUrl(indexedUrl.url)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
