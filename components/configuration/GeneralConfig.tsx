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
import {
  AgentConfigurableOptions,
  ModelType,
  AgentMetadata,
} from "@/types/index";
import { createClient } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { mutate } from "swr";
import { Slider } from "@/components/ui/slider";

interface GeneralConfigProps {
  config: {
    assistant_id: string;
    name: string;
    metadata: AgentMetadata;
    config: {
      configurable: AgentConfigurableOptions;
    };
    avatar?: string | null;
  };
  onChange: (field: string, value: unknown) => void;
  onConfigurableChange: (
    field: keyof AgentConfigurableOptions,
    value: unknown
  ) => void;
}

export function GeneralConfig({
  config,
  onChange,
  onConfigurableChange,
}: GeneralConfigProps) {
  const supabase = createClient();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        const fileName = `${config.assistant_id}-${Date.now()}.${fileExt}`;
        const filePath = `${config.metadata.owner_id}/${fileName}`;

        // Delete old avatar if it exists
        if (config.avatar) {
          const oldFilePath = config.avatar.split("/").pop();
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
        onChange("avatar", publicUrl);

        // Save the changes immediately to persist the avatar
        const response = await fetch(`/api/assistants/${config.assistant_id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...config,
            avatar: publicUrl,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update agent with new avatar");
        }

        // Update SWR cache
        await mutate(`/api/assistants/${config.assistant_id}`);
        await mutate("/api/assistants");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="mb-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={config.avatar || ""} alt={config.name} />
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
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isUploading
              ? "Uploading..."
              : config.avatar
              ? "Change Avatar"
              : "Upload Avatar"}
          </Button>
          {config.avatar && !isUploading && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onChange("avatar", null)}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={config.name}
          onChange={(e) => onChange("name", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={config.metadata.description}
          onChange={(e) =>
            onChange("metadata", {
              ...config.metadata,
              description: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="model">Model</Label>
        <Select
          value={config.config.configurable.model}
          onValueChange={(value: ModelType) =>
            onConfigurableChange("model", value)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4 Optimized</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4 Optimized Mini</SelectItem>
            <SelectItem value="gpt-o1">GPT-O1</SelectItem>
            <SelectItem value="gpt-o1-mini">GPT-O1 Mini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Temperature: {config.config.configurable.temperature}</Label>
        <Slider
          value={[config.config.configurable.temperature]}
          min={0}
          max={1}
          step={0.1}
          onValueChange={([value]) =>
            onConfigurableChange("temperature", value)
          }
        />
      </div>
    </div>
  );
}
