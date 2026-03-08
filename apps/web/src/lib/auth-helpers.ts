import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { UserRole } from "@jobboard/types";

/**
 * Get the current session in a Server Component or Route Handler.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return auth();
}

/**
 * Get the current user or redirect to sign-in.
 * Use in Server Components that require authentication.
 *
 * @example
 * const user = await requireAuth();
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }
  return session.user;
}

/**
 * Get the current user or redirect if role doesn't match.
 * Use in Server Components that require a specific role.
 *
 * @example
 * const user = await requireRole("EMPLOYER");
 */
export async function requireRole(role: UserRole) {
  const user = await requireAuth();
  if (user.role !== role && user.role !== "ADMIN") {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Check if the current user is an employer (without redirecting).
 * Useful for conditional UI rendering in Server Components.
 */
export async function isEmployer(): Promise<boolean> {
  const session = await auth();
  return session?.user?.role === "EMPLOYER" || session?.user?.role === "ADMIN";
}
