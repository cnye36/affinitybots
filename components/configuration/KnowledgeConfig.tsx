import React, { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentConfig, DocumentEntry } from "@/types/agent";
import { Upload, File, Trash2 } from "lucide-react";
import { useToastHook } from "@/components/ui/toast";
import axios from "axios";

interface KnowledgeConfigProps {
  config: AgentConfig;
  onChange: (section: keyof AgentConfig["config"], value: unknown) => void;
}

export const KnowledgeConfig: React.FC<KnowledgeConfigProps> = ({
  config,
  onChange,
}) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToastHook();
  const documents = config.config.knowledgeBase?.documents || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();

    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const response = await axios.post<{ documents: DocumentEntry[] }>(
        `/api/agents/${config.id}/knowledge`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const newDocuments = response.data.documents;
      onChange("knowledgeBase", {
        ...config.config.knowledgeBase,
        documents: [...documents, ...newDocuments],
      });

      toast({
        title: "Success",
        description: "Documents uploaded and processed successfully",
      });
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast({
        title: "Error",
        description: "Failed to upload and process documents",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await axios.delete(`/api/agents/${config.id}/knowledge/${documentId}`);

      const updatedDocuments = documents.filter(
        (doc: DocumentEntry) => doc.id !== documentId
      );
      onChange("knowledgeBase", {
        ...config.config.knowledgeBase,
        documents: updatedDocuments,
      });

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium">Knowledge Base</h3>
            <p className="text-sm text-muted-foreground">
              Upload documents to enhance your agent&apos;s knowledge. Supported
              formats: PDF, TXT, DOC, CSV
            </p>
          </div>

          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PDF, TXT, DOC, CSV (MAX. 10MB)
                </p>
              </div>
              <Input
                id="dropzone-file"
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.txt,.doc,.docx,.csv"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            {documents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents uploaded yet
              </p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: DocumentEntry) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <div className="flex items-center space-x-2">
                      <File className="w-4 h-4" />
                      <span className="text-sm">{doc.filename}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};