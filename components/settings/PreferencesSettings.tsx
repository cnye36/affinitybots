"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createClient } from "@/supabase/client";

interface PreferencesData {
  notifications: boolean;
  language: string;
  timezone: string;
}

interface PreferencesSettingsProps {
  preferences?: Partial<PreferencesData>;
  onUpdate?: (preferences: PreferencesData) => void;
}

export function PreferencesSettings({
  preferences = {},
  onUpdate,
}: PreferencesSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [currentPrefs, setCurrentPrefs] =
    useState<Partial<PreferencesData>>(preferences);

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    try {
      const newPrefs: PreferencesData = {
        notifications: !currentPrefs.notifications,
        language: currentPrefs.language || "English",
        timezone: currentPrefs.timezone || "UTC",
      };

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ preferences: newPrefs })
        .eq("id", user.id);

      if (error) throw error;

      setCurrentPrefs(newPrefs);
      onUpdate?.(newPrefs);
    } catch (err) {
      console.error("Error updating preferences:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
        <CardDescription>Customize your workspace preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about your agents and workflows
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleToggleNotifications}
              disabled={isLoading}
            >
              {currentPrefs.notifications ? "Disable" : "Enable"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Language</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred language
              </p>
            </div>
            <Button variant="outline" disabled>
              {currentPrefs.language || "English"}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Time Zone</Label>
              <p className="text-sm text-muted-foreground">
                Set your local time zone
              </p>
            </div>
            <Button variant="outline" disabled>
              {currentPrefs.timezone || "UTC"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
