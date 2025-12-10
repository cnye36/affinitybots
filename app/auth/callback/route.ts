
import { NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/supabase/types";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;

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

    if (user && user.email) {
      const { data: invite, error: inviteError } = await supabase
        .from("early_access_invites")
        .select("status, id")
        .ilike("email", user.email)
        .single();
      
      console.log("Auth Callback: Invite status:", invite?.status, "Error:", inviteError);

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

      if (invite && invite.status !== 'accepted') {
          await supabase.from("early_access_invites")
            .update({ status: 'accepted', accepted_by_user_id: user.id })
            .eq("id", invite.id);
      }
    } else {
        console.log("Auth Callback: No user session found or no email.");
        return NextResponse.redirect(
          new URL(
            `/auth/signin?error=${encodeURIComponent("Login failed: Could not retrieve user session or email.")}`,
            origin
          )
        );
    }
    // --- whitelist check end ---
  }

  return NextResponse.redirect(new URL(next, origin));
}

