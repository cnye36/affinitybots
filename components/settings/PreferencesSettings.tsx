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
    <Card className="border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/20">
      <CardHeader>
        <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          Preferences
        </CardTitle>
        <CardDescription>Customize your workspace preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div>
              <Label className="text-blue-700 dark:text-blue-300">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email notifications about your agents and workflows
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleToggleNotifications}
              disabled={isLoading}
              className={currentPrefs.notifications ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white" : "border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"}
            >
              {currentPrefs.notifications ? "Disable" : "Enable"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div>
              <Label className="text-blue-700 dark:text-blue-300">Language</Label>
              <p className="text-sm text-muted-foreground">
                Select your preferred language
              </p>
            </div>
            <Button variant="outline" disabled className="border-blue-300 dark:border-blue-700">
              {currentPrefs.language || "English"}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200/50 dark:border-blue-800/50 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/30">
            <div>
              <Label className="text-blue-700 dark:text-blue-300">Time Zone</Label>
              <p className="text-sm text-muted-foreground">
                Set your local time zone
              </p>
            </div>
            <Button variant="outline" disabled className="border-blue-300 dark:border-blue-700">
              {currentPrefs.timezone || "UTC"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
