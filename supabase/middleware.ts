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

  function withSessionCookies(response: NextResponse) {
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
      response.cookies.set(name, value, options)
    })
    return response
  }

  // Check if user is admin using the admin utility
  // Import at top would cause circular dependency, so we inline the check
  const adminEmailsEnv = process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? "cnye@affinitybots.com"
  const adminEmails = adminEmailsEnv
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0)
  const userEmail = (user?.email ?? "").toLowerCase()
  const isAdmin = adminEmails.includes(userEmail)

  // Public routes that don't require subscription
  const publicRoutes = [
    '/',
    '/pricing',
    '/features',
    '/blog',
    '/privacy',
    '/terms',
    '/about',
    '/contact',
  ]
  const isPublicRoute = publicRoutes.some(route =>
    request.nextUrl.pathname === route ||
    request.nextUrl.pathname.startsWith(`${route}/`)
  )
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')
  const isPaymentRoute = request.nextUrl.pathname.startsWith('/payment/')

  // Always protect admin routes regardless of domain/hostname checks below.
  if (request.nextUrl.pathname.startsWith("/api/admin")) {
    if (!user) {
      return withSessionCookies(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    }
    if (!isAdmin) {
      return withSessionCookies(
        NextResponse.json({ error: "Forbidden" }, { status: 403 })
      )
    }
  }

  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = "/auth/signin"
      url.searchParams.set("next", request.nextUrl.pathname)
      return withSessionCookies(NextResponse.redirect(url))
    }
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = "/"
      return withSessionCookies(NextResponse.redirect(url))
    }
  }

  // Check if this is an OAuth callback that Supabase redirected to the wrong path
  // Depending on Site URL, Supabase may redirect to /, /dashboard, etc. with ?code=...
  // We normalize all of these to /auth/callback so the dedicated handler can
  // exchange the code for a session and set cookies correctly.
  // IMPORTANT: Exclude /api/* routes as they have their own OAuth handlers (Google, HubSpot, MCP, etc.)
  const code = request.nextUrl.searchParams.get("code");
  if (code &&
      !request.nextUrl.pathname.startsWith("/auth/callback") &&
      !request.nextUrl.pathname.startsWith("/api/")) {
    console.log("🔍 Middleware: Detected OAuth code on non-callback path, redirecting to /auth/callback");
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/auth/callback";
    // Query params (including code, next, etc.) are already on nextUrl and will be preserved
    return NextResponse.redirect(redirectUrl);
  }

  // Check subscription status for authenticated users (except admins and on public/auth/api routes)
  if (user && !isAdmin && !isPublicRoute && !isAuthRoute && !isApiRoute && !isPaymentRoute) {
    // Get user's subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, trial_end, plan_type')
      .eq('user_id', user.id)
      .single()

    if (subscription) {
      const now = new Date()
      const trialEnd = subscription.trial_end ? new Date(subscription.trial_end) : null

      // Check if user has access
      const hasAccess =
        subscription.status === 'trialing' && trialEnd && trialEnd > now || // In trial period
        subscription.status === 'active' || // Active paid subscription
        subscription.status === 'past_due' // Allow access but show warning

      if (!hasAccess) {
        // User's trial ended or subscription canceled - redirect to pricing
        console.log(`Blocking access for user ${user.id}: status=${subscription.status}, trial_end=${subscription.trial_end}`)
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        url.searchParams.set('reason', 'subscription_required')
        return withSessionCookies(NextResponse.redirect(url))
      }
    } else {
      // No subscription record - shouldn't happen but redirect to pricing to be safe
      console.log(`No subscription found for user ${user.id}, redirecting to pricing`)
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      url.searchParams.set('reason', 'no_subscription')
      return withSessionCookies(NextResponse.redirect(url))
    }
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