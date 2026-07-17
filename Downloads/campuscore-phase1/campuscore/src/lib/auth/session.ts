import { createClient } from "@/lib/supabase/server";
import type { CurrentUserContext, RoleName } from "@/lib/auth/permissions";

/**
 * Loads the current authenticated user plus their role grants, shaped into
 * the CurrentUserContext used by the permission helpers. Returns null if
 * nobody is signed in. Safe to call from Server Components and Route
 * Handlers — relies on the cookie-based server Supabase client, so RLS
 * scopes every query to the signed-in user automatically.
 */
export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const supabase = createClient();

  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, full_name, email, university_id, organization_id, current_level")
    .eq("auth_id", authUser.id)
    .single();

  if (profileError || !profile) {
    // Auth account exists but no matching `users` row yet — happens right
    // after sign-up, before the profile-completion step runs.
    return null;
  }

  const { data: roleRows } = await supabase
    .from("user_roles")
    .select("scope_json, roles(name)")
    .eq("user_id", profile.id);

  const roles = (roleRows ?? []).map((row) => ({
    role: (row.roles as unknown as { name: RoleName })?.name,
    scope: (row.scope_json ?? {}) as CurrentUserContext["roles"][number]["scope"]
  }));

  return {
    userId: profile.id,
    fullName: profile.full_name,
    email: profile.email,
    universityId: profile.university_id,
    organizationId: profile.organization_id,
    currentLevel: profile.current_level,
    roles
  };
}
