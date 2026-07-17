import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import type { CurrentUserContext, RoleName } from "@/lib/auth/permissions";

/**
 * UI-layer guard only — mirrors, but does not replace, the RLS policies in
 * supabase/migrations/0002_rls_policies.sql. This exists so an
 * unauthorized user gets redirected before rendering an admin page full of
 * "no data" states, rather than seeing a confusing empty screen. Even if
 * this check were ever wrong or bypassed, every query the resulting page
 * makes is still independently scoped by RLS — this is UX, not security.
 */
export async function requireRole(allowed: RoleName[]): Promise<CurrentUserContext> {
  const ctx = await getCurrentUserContext();

  if (!ctx) {
    redirect("/login");
  }

  const hasAllowedRole =
    allowed.includes("platform_owner") && ctx.roles.some((r) => r.role === "platform_owner")
      ? true
      : ctx.roles.some((r) => allowed.includes(r.role));

  // platform_owner and university_admin implicitly satisfy any
  // organization_admin-gated page — same "or above" logic RLS uses.
  const escalatedMatch = ctx.roles.some(
    (r) =>
      (r.role === "platform_owner" || r.role === "university_admin") &&
      allowed.includes("organization_admin")
  );

  if (!hasAllowedRole && !escalatedMatch) {
    redirect("/dashboard");
  }

  return ctx;
}
