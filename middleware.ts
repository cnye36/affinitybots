import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const RATE_LIMIT = 100; // Number of requests
const WINDOW_SIZE = 60 * 1000; // 1 minute

const ipMap = new Map<string, { count: number; firstRequest: number }>();

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is not signed in and the current path is not /signin or /signup, redirect to /signin
  if (!session && !['/signin', '/signup'].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/signin', req.url))
  }

  // If user is signed in and the current path is /signin or /signup, redirect to /dashboard
  if (session && ['/signin', '/signup'].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  const ip = req.id || req.headers.get('x-forwarded-for') || 'unknown';
  const currentTime = Date.now();

  if (!ipMap.has(ip)) {
    ipMap.set(ip, { count: 1, firstRequest: currentTime });
  } else {
    const data = ipMap.get(ip)!;
    if (currentTime - data.firstRequest < WINDOW_SIZE) {
      data.count += 1;
      if (data.count > RATE_LIMIT) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    } else {
      ipMap.set(ip, { count: 1, firstRequest: currentTime });
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 