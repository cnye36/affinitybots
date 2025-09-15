import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { OnboardingProvider } from "@/hooks/useOnboarding";
import { TutorialOverlay } from "@/components/onboarding/TutorialOverlay";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Error fetching user:", userError);
  }

  if (!user) {
    redirect("/signin");
  }

  return (
    <OnboardingProvider>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <TutorialOverlay>
            {children}
            <WelcomeModal />
          </TutorialOverlay>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingProvider>
  );
}
