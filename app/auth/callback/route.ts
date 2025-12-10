import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") || "/dashboard";

    // Prepare the final redirect response up-front so we can attach cookies to it
    const redirectResponse = NextResponse.redirect(new URL(next, origin));

    if (!code) {
      return NextResponse.redirect(new URL("/auth/signin", origin));
    if (code) {
      const cookieStore = await cookies();
      
      const supabase = createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) =>
                  cookieStore.set(name, value, options)
                );
              } catch (error) {
                // The `setAll` method was called from a Server Component.
                // This can be ignored if you have middleware refreshing user sessions.
                console.error("Auth Callback: Error setting cookies", error);
              }
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Error exchanging code for session:", error);
        return NextResponse.redirect(
          new URL(
            `/auth/signin?error=${encodeURIComponent("Authentication failed. Please try again.")}`,
            origin
          )
        );
      }

      // --- whitelist check start ---
      const { data: { user } } = await supabase.auth.getUser();
      
      console.log("Auth Callback: User found:", user?.email);

      if (user?.email) {
        const { data: invite, error: inviteError } = await supabase
          .from("early_access_invites")
          .select("status, id")
          .ilike("email", user.email) // Case insensitive check
          .single();
        
        console.log("Auth Callback: Invite status:", invite?.status, "Error:", inviteError);

        // Allow 'invited' (legacy) or 'approved'
        // Also allow 'accepted' if they are just logging in again
        const isApproved = invite && (
          invite.status === 'invited' || 
          invite.status === 'approved' || 
          invite.status === 'accepted'
        );

        if (!isApproved) {
          console.log("Auth Callback: Access Denied. Redirecting to error.");
          await supabase.auth.signOut();
          return NextResponse.redirect(
            new URL(
              `/auth/signin?error=${encodeURIComponent("Your email is not approved for early access.")}`,
              origin
            )
          );
        }

        // Optionally mark as accepted if this is their first login
        if (invite && invite.status !== 'accepted') {
            await supabase.from("early_access_invites")
              .update({ status: 'accepted', accepted_by_user_id: user.id })
              .eq("id", invite.id); // Use ID to be safe
        }
      } else {
          console.log("Auth Callback: No user session found after exchange.");
          return NextResponse.redirect(
            new URL(
              `/auth/signin?error=${encodeURIComponent("Login failed: Could not retrieve user session.")}`,
              origin
            )
          );
      }
      
      if (user && !user.email) {
         console.log("Auth Callback: User has no email.");
         await supabase.auth.signOut();
         return NextResponse.redirect(
            new URL(
              `/auth/signin?error=${encodeURIComponent("Login failed: Provider did not provide an email address.")}`,
              origin
            )
          );
      }
      // --- whitelist check end ---
    }
  } catch (error) {
    console.error("Error in auth callback:", error);
    return NextResponse.redirect(new URL("/auth/signin?error=Verification failed", requestUrl.url));
  }

  // URL to redirect to after sign in process completes
  // Ensure we use the origin from the request to stay on the same domain
  return NextResponse.redirect(new URL(next, origin));
}
