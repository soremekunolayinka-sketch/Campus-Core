import { createClient } from "@/lib/supabase/server";

/**
 * Counts are scoped by RLS exactly like any other query — an org_admin's
 * `count` only reflects rows their policies let them see (their
 * organization/university), never platform-wide totals unless they're a
 * platform_owner. No manual organization_id filtering needed here; RLS
 * already does it.
 *
 * "Students" specifically excludes anyone holding a staff role (course_rep
 * and above) — since the base `student` role is implicit (no row in
 * `user_roles`, per Blueprint v3 §2.1), we count total users minus the
 * distinct set of users who *do* hold an explicit staff role grant.
 */
export async function getAdminOverviewCounts() {
  const supabase = createClient();

  const [
    { count: totalUsers },
    { data: staffRoleRows },
    { count: courses },
    { count: departments },
    { count: enrollments }
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("user_roles").select("user_id"),
    supabase.from("courses").select("*", { count: "exact", head: true }),
    supabase.from("departments").select("*", { count: "exact", head: true }),
    supabase.from("enrollments").select("*", { count: "exact", head: true })
  ]);

  const staffUserCount = new Set((staffRoleRows ?? []).map((r) => r.user_id)).size;

  return {
    students: Math.max((totalUsers ?? 0) - staffUserCount, 0),
    courses: courses ?? 0,
    departments: departments ?? 0,
    enrollments: enrollments ?? 0
  };
}
