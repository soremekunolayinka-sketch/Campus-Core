/**
 * Role hierarchy (Blueprint v3 §2). Six tiers, top to bottom:
 * platform_owner > university_admin > organization_admin > class_governor
 * > course_rep > student.
 *
 * IMPORTANT: this file is a UI convenience layer only — it decides what to
 * SHOW a user, not what they're actually ALLOWED to do. The real
 * enforcement is Postgres RLS (supabase/migrations/0002_rls_policies.sql).
 * Every check here has a matching RLS policy; if they ever disagree, the
 * database wins and the user simply sees an error from a blocked request.
 */

export type RoleName =
  | "platform_owner"
  | "university_admin"
  | "organization_admin"
  | "class_governor"
  | "course_rep"
  | "student";

export interface UserRoleGrant {
  role: RoleName;
  scope: {
    university_id?: string;
    organization_id?: string;
    level?: number;
    course_offering_id?: string;
  };
}

export interface CurrentUserContext {
  userId: string;
  fullName: string;
  email: string;
  universityId: string | null;
  organizationId: string | null;
  currentLevel: number | null; // dashboard personalization only — never an access check
  roles: UserRoleGrant[];
}

export function isPlatformOwner(ctx: CurrentUserContext): boolean {
  return ctx.roles.some((r) => r.role === "platform_owner");
}

export function isUniversityAdminFor(ctx: CurrentUserContext, universityId: string): boolean {
  return (
    isPlatformOwner(ctx) ||
    ctx.roles.some((r) => r.role === "university_admin" && r.scope.university_id === universityId)
  );
}

export function isOrgAdminOrAbove(ctx: CurrentUserContext, organizationId: string, universityId?: string): boolean {
  if (isPlatformOwner(ctx)) return true;
  if (ctx.roles.some((r) => r.role === "organization_admin" && r.scope.organization_id === organizationId)) {
    return true;
  }
  if (universityId && isUniversityAdminFor(ctx, universityId)) return true;
  return false;
}

export function isClassGovernorFor(ctx: CurrentUserContext, organizationId: string, level: number): boolean {
  return ctx.roles.some(
    (r) => r.role === "class_governor" && r.scope.organization_id === organizationId && r.scope.level === level
  );
}

export function isCourseRepFor(ctx: CurrentUserContext, courseOfferingId: string): boolean {
  return ctx.roles.some((r) => r.role === "course_rep" && r.scope.course_offering_id === courseOfferingId);
}

/** Highest role a user holds, for display purposes (e.g. a badge in the nav). */
export function highestRoleLabel(ctx: CurrentUserContext): string {
  const order: RoleName[] = [
    "platform_owner",
    "university_admin",
    "organization_admin",
    "class_governor",
    "course_rep",
    "student"
  ];
  const labels: Record<RoleName, string> = {
    platform_owner: "Platform Owner",
    university_admin: "University Admin",
    organization_admin: "Organization Admin",
    class_governor: "Class Governor",
    course_rep: "Course Representative",
    student: "Student"
  };
  for (const role of order) {
    if (ctx.roles.some((r) => r.role === role)) return labels[role];
  }
  return labels.student;
}
