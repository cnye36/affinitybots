'use client'

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { UserProfile } from "@/types/user";
import { createClient } from "@/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, CreditCard, Settings2, GraduationCap } from "lucide-react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { BillingSettings } from "@/components/settings/BillingSettings";
import { PreferencesSettings } from "@/components/settings/PreferencesSettings";
import { TutorialSettings } from "@/components/settings/TutorialSettings";

function SettingsContent() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = searchParams.get("tab") || "profile";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

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
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg w-full max-w-md mb-6"></div>
          <div className="h-[400px] bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
        Settings
      </h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="default" className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
          <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">Your settings have been updated.</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-200/50 dark:border-blue-800/50">
          <TabsTrigger
            value="profile"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="billing"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <Settings2 className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger
            value="tutorials"
            className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white"
          >
            <GraduationCap className="h-4 w-4" />
            Tutorials
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

        <TabsContent value="tutorials">
          <TutorialSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="container max-w-5xl py-8">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <div className="animate-pulse">
          <div className="h-10 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-950/30 dark:to-cyan-950/30 rounded-lg w-full max-w-md mb-6"></div>
          <div className="h-[400px] bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"></div>
        </div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}