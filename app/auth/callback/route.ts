
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  // Get next from query params (passed through Supabase's queryParams option)
  // OR from the URL if Supabase adds it, OR default to dashboard
  const next = requestUrl.searchParams.get("next") || "/dashboard";
  const origin = requestUrl.origin;
  
  // Log if we're on the wrong origin (this helps debug Supabase redirect issues)
  if (origin.includes("affinitybots.com") && process.env.NODE_ENV === "development") {
    console.warn("⚠️ Auth Callback: Received callback on production domain in development mode!");
    console.warn("⚠️ This suggests Supabase Site URL is set to production. Check Supabase dashboard.");
  }

  console.log("🔍 Auth Callback: Starting callback handler");
  console.log("🔍 Auth Callback: Request URL:", requestUrl.toString());
  console.log("🔍 Auth Callback: Origin:", origin);
  console.log("🔍 Auth Callback: Code present:", !!code);
  console.log("🔍 Auth Callback: Next redirect:", next);

  if (!code) {
    console.log("❌ Auth Callback: No code parameter, redirecting to sign-in");
    return NextResponse.redirect(new URL("/auth/signin", origin));
  }

  // Create the redirect response FIRST
  let redirectResponse = NextResponse.redirect(new URL(next, origin));
  
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Write to the redirect response so cookies are sent to browser
            redirectResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  console.log("🔍 Auth Callback: Exchanging code for session...");
  const { error, data: sessionData } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("❌ Auth Callback: Error exchanging code for session:", error);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent("Authentication failed. Please try again.")}`,
        origin
      )
    );
  }
  console.log("✅ Auth Callback: Code exchanged successfully");

  // --- whitelist check start ---
  console.log("🔍 Auth Callback: Getting user from session...");
  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  
  if (getUserError) {
    console.error("❌ Auth Callback: Error getting user:", getUserError);
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent("Failed to retrieve user session.")}`,
        origin
      )
    );
  }
  
  console.log("✅ Auth Callback: User found:", user?.email);

  console.log("✅ Auth Callback: User authenticated, proceeding to dashboard");
  if (!user?.email) {
      console.log("❌ Auth Callback: No user session found or no email.");
      return NextResponse.redirect(
        new URL(
          `/auth/signin?error=${encodeURIComponent("Login failed: Could not retrieve user session or email.")}`,
          origin
        )
      );
  }
  // --- whitelist check end ---

  console.log("✅ Auth Callback: All checks passed, redirecting to:", redirectResponse.headers.get("location"));
  return redirectResponse;
}

