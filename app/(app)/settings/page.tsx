'use client'

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCard, Settings2, User } from "lucide-react";
import { createClient } from "@/supabase/client";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";

interface UserProfile {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar_url: string | null;
  updated_at?: string;
  provider?: string;
  preferences?: {
    notifications: boolean;
    language: string;
    timezone: string;
  };
}

export default function SettingsPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Get existing profile data
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          // Extract metadata from auth
          const authMetadata = user.user_metadata || {};
          const provider = user.app_metadata?.provider || "email";

          // Merge auth metadata with profile data
          const mergedData: UserProfile = {
            id: user.id,
            email: profile?.email || user.email || "",
            name:
              profile?.name ||
              authMetadata.full_name ||
              authMetadata.name ||
              "",
            username:
              profile?.username ||
              authMetadata.preferred_username ||
              authMetadata.username ||
              user.email?.split("@")[0] ||
              "",
            avatar_url:
              profile?.avatar_url ||
              authMetadata.avatar_url ||
              authMetadata.picture ||
              null,
            provider,
            updated_at: profile?.updated_at ?? undefined,
            preferences: profile?.preferences ?? undefined,
          };

          setUserData(mergedData);

          // If profile doesn't exist or needs updating, sync the data
          if (!profile || Object.keys(authMetadata).length > 0) {
            const { error: syncError } = await supabase
              .from("profiles")
              .upsert({
                id: mergedData.id,
                email: mergedData.email,
                username: mergedData.username,
                name: mergedData.name,
                avatar_url: mergedData.avatar_url,
                preferences: mergedData.preferences ?? null,
                updated_at: new Date().toISOString(),
              });

            if (syncError) throw syncError;
          }
        }
      } catch (err) {
        console.error("Error loading user data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  const handleUpdate = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const handleError = (err: Error) => {
    setError(err.message);
    setTimeout(() => setError(null), 3000);
  };

  if (loading) {
    return (
      <div className="container max-w-5xl py-8">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-32 mb-4"></div>
          <div className="h-[400px] bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="mb-4">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Your settings have been updated.</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings
            initialData={userData || undefined}
            onUpdate={handleUpdate}
            onError={handleError}
          />
        </TabsContent>

        <TabsContent value="billing">
          <BillingSettings />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesSettings
            preferences={userData?.preferences}
            onUpdate={handleUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}