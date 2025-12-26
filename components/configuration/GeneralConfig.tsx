"use client";

import React, { useCallback, useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AssistantConfiguration, AssistantMetadata } from "@/types/assistant";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/useToast";
import { LLM_OPTIONS, legacyModelToLlmId } from "@/lib/llm/catalog";

interface GeneralConfigProps {
  config: {
    id: string;
    name: string;
    description: string;
    metadata: AssistantMetadata;
    config: AssistantConfiguration;
    agent_avatar?: string | null;
  };
  onChange: (field: string, value: unknown) => void;
  onConfigurableChange: (
    field: keyof AssistantConfiguration,
    value: unknown
  ) => void;
  /**
   * Optional flags to control which sections are rendered.
   * Defaults preserve the original full layout.
   */
  showProfileSection?: boolean;
  showModelSection?: boolean;
  showDangerZone?: boolean;
}

export function GeneralConfig({
  config,
  onChange,
  onConfigurableChange,
  showProfileSection = true,
  showModelSection = true,
  showDangerZone = true,
}: GeneralConfigProps) {
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error("File size must be less than 5MB");
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error("File must be an image");
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${config.id}-${Date.now()}.${fileExt}`;
        const filePath = `${config.metadata.owner_id}/${fileName}`;

        // Delete old avatar if it exists
        if (config.agent_avatar) {
          const oldFilePath = config.agent_avatar.split("/").pop();
          if (oldFilePath) {
            await supabase.storage
              .from("agent-avatars")
              .remove([`${config.metadata.owner_id}/${oldFilePath}`]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from("agent-avatars")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("agent-avatars").getPublicUrl(filePath);

        // Update the avatar in the parent component
        onChange("agent_avatar", publicUrl);

        // Save the changes immediately to persist the avatar
        const response = await fetch(`/api/agents/${config.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: config.name,
            description: config.description,
            metadata: {
              ...config.metadata,
              agent_avatar: publicUrl,
            },
            // No config change here, but the API expects a config object
            config: { configurable: config.config },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update agent with new avatar");
        }

        // Update SWR cache
        await mutate(`/api/agents/${config.id}`);
        await mutate("/api/agents");
      } catch (error) {
        console.error("Error uploading avatar:", error);
        if (error instanceof Error) {
          alert(error.message);
        } else {
          alert("Failed to upload avatar");
        }
      } finally {
        setIsUploading(false);
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [config, onChange, supabase.storage]
  );

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/agents/${config.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete agent");
      }

      await mutate("/api/agents");
      router.push("/agents");
      toast({
        title: "Agent deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting agent:", error);
      toast({
        title: "Failed to delete agent",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {showProfileSection && (
        <div className="rounded-xl border-2 border-violet-200/50 dark:border-violet-800/50 bg-gradient-to-br from-violet-50/30 to-purple-50/30 dark:from-violet-950/20 dark:to-purple-950/20 p-6">
          <div className="flex flex-col items-center">
            {/* Avatar with gradient ring */}
            <div className="relative mb-4">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-purple-500 dark:from-violet-600 dark:to-purple-600 rounded-full blur opacity-75" />
              <Avatar className="relative h-24 w-24 border-4 border-white dark:border-gray-900">
                <AvatarImage src={config.agent_avatar || ""} alt={config.name} />
                <AvatarFallback
                  style={{
                    backgroundColor: `hsl(${
                      (config.name.length * 30) % 360
                    }, 70%, 50%)`,
                  }}
                  className="text-xl font-medium text-white"
                >
                  {config.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileInput}
                disabled={isUploading}
                className="border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {isUploading
                  ? "Uploading..."
                  : config.agent_avatar
                  ? "Change Avatar"
                  : "Upload Avatar"}
              </Button>
              {config.agent_avatar && !isUploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onChange("agent_avatar", null)}
                  className="border-violet-300 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-950/50"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {showProfileSection && (
        <div className="space-y-4 rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-violet-500" />
            <h4 className="text-sm font-medium text-foreground">Basic Information</h4>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Name</Label>
            <Input
              id="name"
              value={config.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            <Input
              id="description"
              value={config.description}
              onChange={(e) => onChange("description", e.target.value)}
              placeholder="Describe what this agent does..."
              className="bg-background"
            />
          </div>
        </div>
      )}

      {showModelSection && (
        <div className="space-y-4 rounded-lg border border-violet-200/30 dark:border-violet-800/30 bg-background/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-1 w-1 rounded-full bg-violet-500" />
            <h4 className="text-sm font-medium text-foreground">Model Configuration</h4>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model" className="text-sm font-medium">Model</Label>
            <Select
              value={config.config.llm || legacyModelToLlmId(config.config.model) || ""}
              onValueChange={(value: string) => {
                onConfigurableChange("llm", value);
              }}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[1000]">
                {LLM_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditional params: reasoning only for GPT-5, temperature for all others */}
          {config.config.model === "gpt-5" ? (
            <div className="space-y-2">
              <Label htmlFor="reasoningEffort" className="text-sm font-medium">Reasoning Effort</Label>
              <Select
                value={(config.config.reasoningEffort as any) || "medium"}
                onValueChange={(value: "low" | "medium" | "high") =>
                  onConfigurableChange("reasoningEffort", value)
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[1000]">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher effort means more thorough reasoning but slower responses
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="temperature" className="text-sm font-medium">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={String((config.config.temperature as number | undefined) ?? 0.3)}
                onChange={(e) =>
                  onConfigurableChange("temperature", Number(e.target.value))
                }
                className="bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Lower values (0.0-0.5) = more focused, higher values (0.5-2.0) = more creative
              </p>
            </div>
          )}
        </div>
      )}

      {showDangerZone && (
        <div className="rounded-lg border-2 border-red-200/50 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-1 w-1 rounded-full bg-red-500" />
            <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Deleting this agent is permanent and cannot be undone. Any workflows using this agent will fail.
          </p>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="shadow-lg shadow-red-500/20"
          >
            Delete Agent
          </Button>
        </div>
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              agent and any workflows using this agent will fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
