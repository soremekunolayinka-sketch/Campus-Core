import { createClient } from "@/lib/supabase/server";

export interface DashboardEnrollment {
  id: string;
  enrollmentType: string;
  status: string;
  courseCode: string;
  courseTitle: string;
  units: number;
  level: number;
}

export interface DashboardAnnouncement {
  id: string;
  title: string;
  body: string;
  priority: string;
  createdAt: string;
  isRead: boolean;
}

export interface DashboardDeadline {
  id: string;
  title: string;
  type: string;
  startDate: string;
}

export async function getDashboardData(userId: string) {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: enrollmentRows }, { data: announcementRows }, { data: readRows }, { data: deadlineRows }] =
    await Promise.all([
      supabase
        .from("enrollments")
        .select("id, enrollment_type, status, course_offerings(level, courses(code, title, units))")
        .eq("student_id", userId)
        .in("status", ["active", "pending_approval", "completed"]),
      // RLS already scopes this to what the signed-in user can see across
      // every announcement scope (university/faculty/department/organization/
      // course_offering) — no manual filtering needed here.
      supabase.from("announcements").select("id, title, body, priority, created_at").order("created_at", {
        ascending: false
      }).limit(5),
      supabase.from("announcement_reads").select("announcement_id").eq("user_id", userId),
      supabase
        .from("calendar_events")
        .select("id, title, type, start_date")
        .gte("start_date", today)
        .order("start_date")
        .limit(3)
    ]);

  const readIds = new Set((readRows ?? []).map((r) => r.announcement_id));

  const enrollments: DashboardEnrollment[] = (enrollmentRows ?? []).map((e) => {
    const offering = e.course_offerings as unknown as {
      level: number;
      courses: { code: string; title: string; units: number };
    } | null;
    return {
      id: e.id,
      enrollmentType: e.enrollment_type,
      status: e.status,
      courseCode: offering?.courses?.code ?? "—",
      courseTitle: offering?.courses?.title ?? "—",
      units: offering?.courses?.units ?? 0,
      level: offering?.level ?? 0
    };
  });

  const announcements: DashboardAnnouncement[] = (announcementRows ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    priority: a.priority,
    createdAt: a.created_at,
    isRead: readIds.has(a.id)
  }));

  const activeOrPending = enrollments.filter((e) => e.status === "active" || e.status === "pending_approval");
  const pendingCount = enrollments.filter((e) => e.status === "pending_approval").length;

  return {
    enrollments,
    totalUnits: activeOrPending.reduce((sum, e) => sum + e.units, 0),
    registrationStatusLabel:
      pendingCount > 0 ? `${pendingCount} pending approval` : activeOrPending.length > 0 ? "Registered" : "Not registered",
    announcements,
    unreadAnnouncementCount: announcements.filter((a) => !a.isRead).length,
    upcomingDeadlines: (deadlineRows ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      startDate: d.start_date
    })) as DashboardDeadline[]
  };
}
