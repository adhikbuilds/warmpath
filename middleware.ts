import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Edge-safe auth guard.
//
// We intentionally do NOT import `@/lib/auth` here: that module pulls in the
// Prisma client (Neon adapter) and bcryptjs at load time, neither of which is
// safe in the Edge runtime that middleware runs in. With the JWT session
// strategy, an authenticated user always carries the Auth.js session cookie, so
// a cookie-presence check is a correct, cheap gate for the redirect UX.
//
// Real authorization (signature-verified session, workspace scoping) still
// happens server-side in every API route via `auth()` / `getWorkspaceId()`.
// This middleware only stops the pre-hydration flash of protected pages by
// redirecting unauthenticated requests to /login at the edge.

const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((name) => req.cookies.has(name));
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Only run on the protected app routes. Route groups like (app) are NOT part of
// the URL, so each segment is matched by its real path. Public routes (/, /login,
// /onboarding, /pitch), API routes, and static assets are excluded by omission.
export const config = {
  matcher: [
    "/accounts/:path*",
    "/ai-usage/:path*",
    "/analytics/:path*",
    "/approval-queue/:path*",
    "/audience-builder/:path*",
    "/audit-log/:path*",
    "/billing/:path*",
    "/campaigns/:path*",
    "/contacts/:path*",
    "/dashboard/:path*",
    "/demo-lab/:path*",
    "/discover/:path*",
    "/integrations/:path*",
    "/knowledge-base/:path*",
    "/relationship-graph/:path*",
    "/settings/:path*",
    "/signals/:path*",
    "/tasks/:path*",
    "/team/:path*",
    "/warm-leads/:path*",
  ],
};
