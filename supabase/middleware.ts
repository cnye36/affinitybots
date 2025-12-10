import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if this is an OAuth callback that Supabase redirected to root path
  // When Site URL is set to the base URL, Supabase may redirect to /?code=... instead of /auth/callback?code=...
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname === "/") {
    console.log("🔍 Middleware: Detected OAuth code on root path, redirecting to /auth/callback");
    const redirectUrl = new URL("/auth/callback", request.nextUrl.origin);
    // Preserve all query parameters (code, next, etc.)
    request.nextUrl.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(redirectUrl);
  }

  // Get the hostname from the request
  const hostname = request.headers.get("host") || "";

  // Check if this is the marketing site or the app
  const isAppDomain = hostname.includes("app.AffinityBots.click");
  const isMarketingDomain = hostname.includes("AffinityBots.click") && !isAppDomain;

  // Different rules for different domains
  if (isAppDomain) {
    // App domain requires authentication for most routes
    if (
      !user &&
      !request.nextUrl.pathname.startsWith("/auth/signin") &&
      !request.nextUrl.pathname.startsWith("/auth/signup") &&
      // Allow OAuth callback to run unauthenticated so it can set the session
      !request.nextUrl.pathname.startsWith("/auth/callback") &&
      !request.nextUrl.pathname.startsWith("/auth/validate-invite") &&
      !request.nextUrl.pathname.startsWith("/auth/verify-email") &&
      request.nextUrl.pathname !== "/"
    ) {
      // no user, redirect to signin
      const url = request.nextUrl.clone();
      console.log("Redirecting to signin");
      url.pathname = "/auth/signin";
      return NextResponse.redirect(url);
    }
  } else if (isMarketingDomain) {
    // Marketing site has no auth requirements except for admin pages
    if (!user && request.nextUrl.pathname.startsWith("/admin")) {
      // Admin pages require authentication
      const url = request.nextUrl.clone();
      url.pathname = "/auth/signin";
      return NextResponse.redirect(url);
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}