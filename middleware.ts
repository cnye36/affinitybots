import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

  return res
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
} 