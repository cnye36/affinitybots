"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { createClient } from "@/supabase/client";

interface ProfileData {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url: string | null;
  provider?: string;
}

interface ProfileSettingsProps {
  initialData?: Partial<ProfileData>;
  onUpdate?: (data: ProfileData) => void;
  onError?: (error: Error) => void;
}

export function ProfileSettings({
  initialData,
  onUpdate,
  onError,
}: ProfileSettingsProps) {
  const [email, setEmail] = useState(initialData?.email || "");
  const [username, setUsername] = useState(initialData?.username || "");
  const [name, setName] = useState(initialData?.name || "");
  const [avatar, setAvatar] = useState<string | null>(
    initialData?.avatar_url || null
  );
  const [isUploading, setIsUploading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email,
        username,
        name,
        avatar_url: avatar,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      onUpdate?.({
        id: user.id,
        email,
        username,
        name,
        avatar_url: avatar,
        provider: initialData?.provider,
      });
    } catch (err) {
      console.error("Error updating profile:", err);
      onError?.(err instanceof Error ? err : new Error("An error occurred"));
    }
  };

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()
          .toString(36)
          .slice(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        setAvatar(publicUrl);
      } catch (err) {
        console.error("Error uploading avatar:", err);
        onError?.(
          err instanceof Error ? err : new Error("Failed to upload avatar")
        );
      } finally {
        setIsUploading(false);
      }
    },
    [onError]
  );

  return (
    <Card className="border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          Profile Settings
        </CardTitle>
        <CardDescription>
          Manage your profile information and preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {/* Gradient ring around avatar */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 rounded-full blur-sm opacity-75" />
              <Avatar className="relative h-24 w-24 border-2 border-white dark:border-gray-900">
                <AvatarImage src={avatar || undefined} />
                <AvatarFallback
                  className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold"
                >
                  {username?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-0 right-0 p-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 cursor-pointer shadow-lg ${
                  isUploading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <Upload className="h-4 w-4 text-white" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {isUploading
                ? "Uploading..."
                : "Click the upload icon to change your avatar"}
            </p>
            {initialData?.provider && (
              <p className="text-xs text-muted-foreground">
                Connected with {initialData.provider}
              </p>
            )}
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                placeholder="Your full name"
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                placeholder="Your username"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                placeholder="your-email@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={initialData?.provider !== "email"}
              />
              {initialData?.provider !== "email" && (
                <p className="text-xs text-muted-foreground">
                  Email is managed by your {initialData?.provider} account
                </p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isUploading}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
          >
            Update Profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
