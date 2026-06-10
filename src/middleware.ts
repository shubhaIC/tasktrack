/**
 * Middleware to protect authenticated-only routes.
 *
 * This middleware checks for a Supabase session token cookie and redirects
 * unauthenticated users to `/login` when trying to access protected routes.
 *
 * Protects: /dashboard, /tasks, /courses, /meetings
 *
 * IMPORTANT: Supabase session cookie name may vary depending on how you initialize
 * the client. Common names include `sb-access-token` or `supabase-auth-token`.
 * Adjust the cookie checks below to match your setup.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/tasks', '/courses', '/meetings'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only apply to protected paths (and their subpaths)
  const matches = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!matches) return NextResponse.next();

  // Check for common Supabase auth cookies. Update this if your auth uses a different name.
  const cookie = req.cookies.get('sb-access-token') || req.cookies.get('supabase-auth-token') || req.cookies.get('sb:token');

  if (!cookie) {
    const loginUrl = new URL('/login', req.url);
    // Redirect unauthenticated users to /login
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: PROTECTED_PATHS.map((p) => `${p}/:path*`).concat(PROTECTED_PATHS)
};
