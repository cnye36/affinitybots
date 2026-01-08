import { createClient } from "@/supabase/server";
import { redirect } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppMobileNav } from "@/components/layout/app-mobile-nav";
import { AutoCollapseWrapper } from "@/components/layout/auto-collapse-wrapper";
import { AIUsageWrapper } from "@/components/layout/AIUsageWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

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
    redirect("/auth/signin");
  }

  return (
    <ErrorBoundary>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <AppMobileNav />
          <AutoCollapseWrapper>
            <div className="flex flex-1 flex-col pb-24 md:pb-0">
              <ErrorBoundary>{children}</ErrorBoundary>
            </div>
          </AutoCollapseWrapper>
        </SidebarInset>
        <AIUsageWrapper />
      </SidebarProvider>
    </ErrorBoundary>
  );
}
