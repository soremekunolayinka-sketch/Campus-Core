import { createClient } from "@/lib/supabase/server";

export interface RegistrationOffering {
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  units: number;
  status: "C" | "E" | "R";
}

export interface RegisteredCourse {
  enrollmentId: string;
  offeringId: string;
  courseCode: string;
  courseTitle: string;
  units: number;
  status: string;
}

export interface RegistrationPageData {
  windowState: "open" | "upcoming" | "closed" | "none";
  window: { opensAt: string; closesAt: string; requiresApproval: boolean; maxUnits: number | null } | null;
  compulsoryOfferings: RegistrationOffering[];
  electiveOfferings: RegistrationOffering[];
  registeredCourses: RegisteredCourse[];
  totalRegisteredUnits: number;
}

/**
 * "Available for the current registration period" is scoped to the
 * student's current_level — a deliberate UX default (students primarily
 * register their own level's offerings each semester), NOT an access-
 * control decision. current_level still never gates anything; it only
 * decides what's shown in this specific browse list. A carryover/elective
 * from another level still reaches a student's course list the same way
 * it always has — via an admin-created enrollment (Phase 2's flow) — and
 * shows up in "already registered" here regardless of level.
 */
export async function getRegistrationPageData(userId: string, currentLevel: number | null): Promise<RegistrationPageData> {
  const supabase = createClient();

  const { data: semester } = await supabase
    .from("semesters")
    .select("id, academic_session_id")
    .eq("is_active", true)
    .maybeSingle();

  if (!semester) {
    return {
      windowState: "none",
      window: null,
      compulsoryOfferings: [],
      electiveOfferings: [],
      registeredCourses: [],
      totalRegisteredUnits: 0
    };
  }

  const [{ data: windowRow }, { data: offeringRows }, { data: enrollmentRows }] = await Promise.all([
    supabase
      .from("registration_windows")
      .select("opens_at, closes_at, requires_approval, max_units_per_student")
      .eq("semester_id", semester.id)
      .order("opens_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("course_offerings")
      .select("id, level, status, courses(code, title, units)")
      .eq("semester_id", semester.id)
      .eq("level", currentLevel ?? 0),
    supabase
      .from("enrollments")
      .select("id, course_offering_id, status, course_offerings(courses(code, title, units))")
      .eq("student_id", userId)
      .eq("semester_id", semester.id)
      .in("status", ["active", "pending_approval", "completed"])
  ]);

  const now = new Date();
  let windowState: RegistrationPageData["windowState"] = "none";
  if (windowRow) {
    const opens = new Date(windowRow.opens_at);
    const closes = new Date(windowRow.closes_at);
    windowState = now < opens ? "upcoming" : now > closes ? "closed" : "open";
  }

  const registeredOfferingIds = new Set((enrollmentRows ?? []).map((e) => e.course_offering_id));

  const offerings: RegistrationOffering[] = (offeringRows ?? [])
    .filter((o) => !registeredOfferingIds.has(o.id))
    .map((o) => {
      const course = o.courses as unknown as { code: string; title: string; units: number } | null;
      return {
        offeringId: o.id,
        courseCode: course?.code ?? "—",
        courseTitle: course?.title ?? "—",
        units: course?.units ?? 0,
        status: o.status
      };
    });

  const registeredCourses: RegisteredCourse[] = (enrollmentRows ?? []).map((e) => {
    const offering = e.course_offerings as unknown as { courses: { code: string; title: string; units: number } } | null;
    return {
      enrollmentId: e.id,
      offeringId: e.course_offering_id,
      courseCode: offering?.courses?.code ?? "—",
      courseTitle: offering?.courses?.title ?? "—",
      units: offering?.courses?.units ?? 0,
      status: e.status
    };
  });

  return {
    windowState,
    window: windowRow
      ? {
          opensAt: windowRow.opens_at,
          closesAt: windowRow.closes_at,
          requiresApproval: windowRow.requires_approval,
          maxUnits: windowRow.max_units_per_student
        }
      : null,
    compulsoryOfferings: offerings.filter((o) => o.status === "C"),
    electiveOfferings: offerings.filter((o) => o.status === "E"),
    registeredCourses,
    totalRegisteredUnits: registeredCourses
      .filter((c) => c.status === "active" || c.status === "pending_approval")
      .reduce((sum, c) => sum + c.units, 0)
  };
}
