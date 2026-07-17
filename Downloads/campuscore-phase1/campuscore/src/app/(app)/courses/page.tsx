import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export default async function MyCoursesPage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const supabase = createClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, enrollment_type, status, course_offering_id, course_offerings(level, courses(code, title, units))"
    )
    .eq("student_id", ctx.userId)
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">My Courses</h1>
      <p className="mt-1 text-sm text-slate-500">
        Every course you have access to — determined by enrollment, not your current level.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(enrollments ?? []).map((e) => {
          const offering = e.course_offerings as unknown as {
            level: number;
            courses: { code: string; title: string; units: number };
          } | null;
          return (
            <Link
              key={e.id}
              href={`/courses/${e.course_offering_id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-brand"
            >
              <div className="flex items-start justify-between">
                <p className="font-semibold text-slate-900">{offering?.courses?.code}</p>
                {e.enrollment_type !== "normal" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    {e.enrollment_type}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{offering?.courses?.title}</p>
              <p className="mt-2 text-xs text-slate-400">
                {offering?.level}L · {offering?.courses?.units} units
                {e.status === "completed" && " · Completed"}
              </p>
            </Link>
          );
        })}
        {(!enrollments || enrollments.length === 0) && (
          <p className="col-span-2 rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
            No courses yet — enrollment grants access here.
          </p>
        )}
      </div>
    </div>
  );
}
