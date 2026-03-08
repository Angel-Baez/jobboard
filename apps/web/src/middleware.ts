import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Route protection matrix:
 *
 * /dashboard/*     → requires any authenticated user
 * /employer/*      → requires role: EMPLOYER
 * /admin/*         → requires role: ADMIN
 * /onboarding      → requires auth (redirected here after first sign-in)
 * /auth/*          → public (sign-in, error pages)
 * /*               → public (job listings, company pages)
 */

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"];
const EMPLOYER_ROUTES = ["/employer"];
const ADMIN_ROUTES = ["/admin"];

export default auth((req: NextRequest & { auth: Awaited<ReturnType<typeof auth>> }) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthed = !!session?.user;
  const role = session?.user?.role;

  // ── Admin routes ──────────────────────────────────────────
  if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthed || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
  }

  // ── Employer routes ───────────────────────────────────────
  if (EMPLOYER_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
    if (role !== "EMPLOYER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  // ── General protected routes ──────────────────────────────
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r))) {
    if (!isAuthed) {
      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(pathname)}`, req.url)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  // Skip static files, _next internals, and API auth routes
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
