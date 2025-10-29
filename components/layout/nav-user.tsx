"use client"

import { useEffect, useState } from "react";
import {
  ChevronsUpDown,
  CreditCard,
  LogOut,
  User,
  Settings2,
} from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/supabase/client";
import { RateLimitProgress } from "@/components/RateLimitProgress";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface UserData {
  name?: string;
  email?: string;
  avatar_url?: string;
}

export function NavUser({ user: initialUser }: { user?: UserData }) {
  const { isMobile } = useSidebar();
  const [user, setUser] = useState<UserData | undefined>(initialUser);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email, avatar_url")
            .eq("id", authUser.id)
            .single();

          // Extract metadata from auth
          const authMetadata = authUser.user_metadata || {};

          // Merge profile data with auth metadata
          const userData = {
            name:
              profile?.name ||
              authMetadata.full_name ||
              authMetadata.name ||
              authUser.email?.split("@")[0] ||
              "User",
            email: profile?.email || authUser.email,
            avatar_url:
              profile?.avatar_url ||
              authMetadata.avatar_url ||
              authMetadata.picture,
          };

          setUser(userData);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    }

    loadUserProfile();
  }, []);

  const userInitials = user?.name
    ? user.name.substring(0, 2).toUpperCase()
    : "U";

  // Get user ID for rate limiting
  const [userId, setUserId] = useState<string | undefined>();

  useEffect(() => {
    async function getUserId() {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          setUserId(authUser.id);
        }
      } catch (err) {
        console.error("Error getting user ID:", err);
      }
    }
    getUserId();
  }, []);

  return (
    <SidebarMenu>
      {/* Rate limit progress bar */}
      <div className="px-3 py-2 group-data-[collapsible=icon]:hidden">
        <RateLimitProgress userId={userId} />
      </div>
      
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar_url} alt={user?.name} />
                <AvatarFallback className="rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {user?.name || "User"}
                </span>
                <span className="truncate text-xs">
                  {user?.email || "user@example.com"}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user?.name || "User"}
                  </span>
                  <span className="truncate text-xs">
                    {user?.email || "user@example.com"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <a href="/settings">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings?tab=billing">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Billing
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings?tab=preferences">
                  <Settings2 className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <div className="px-2 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
