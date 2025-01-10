import React, { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AgentConfig } from "@/types/agent";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Image from "next/image";
interface GeneralConfigProps {
  config: AgentConfig;
  onChange: (field: keyof AgentConfig, value: unknown) => void;
}

export const GeneralConfig: React.FC<GeneralConfigProps> = ({
  config,
  onChange,
}) => {
  const supabase = createClient();

  const handleConfigChange = (field: string, value: string) => {
    onChange("config", { ...config.config, [field]: value });
  };

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${config.id}-${Date.now()}.${fileExt}`;
        const filePath = `${config.owner_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("agent-avatars")
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("agent-avatars").getPublicUrl(filePath);

        onChange("avatar", publicUrl);
      } catch (error) {
        console.error("Error uploading avatar:", error);
      }
    },
    [config.id, config.owner_id, onChange, supabase.storage]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="mb-4">
          {config.avatar ? (
            <Image
              src={config.avatar}
              alt={config.name}
              width={96}
              height={96}
              className="rounded-full object-cover ring-2 ring-background"
            />
          ) : (
            <div
              className="h-24 w-24 rounded-full ring-2 ring-background flex items-center justify-center text-xl font-medium text-white"
              style={{
                backgroundColor: `hsl(${
                  (config.name.length * 30) % 360
                }, 70%, 50%)`,
              }}
            >
              {config.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            className="hidden"
            id="avatar-upload"
            onChange={handleAvatarUpload}
          />
          <Label htmlFor="avatar-upload" className="cursor-pointer">
            <Button type="button" variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              {config.avatar ? "Change Avatar" : "Upload Avatar"}
            </Button>
          </Label>
          {config.avatar && (
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

      <div>
        <Label>Name</Label>
        <Input
          value={config.name}
          onChange={(e) => onChange("name", e.target.value)}
          placeholder="Enter agent name"
        />
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={config.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Enter agent description"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Model</Label>
          <Select
            value={config.model_type}
            onValueChange={(value) => onChange("model_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini (Free)</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o (Pro)</SelectItem>
              {/* Add more models as needed */}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tone</Label>
          <Select
            value={config.config?.tone || "default"}
            onValueChange={(value) => handleConfigChange("tone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Language</Label>
          <Select
            value={config.config?.language || "en"}
            onValueChange={(value) => handleConfigChange("language", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto</SelectItem>
              {/* Add more languages as needed */}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
