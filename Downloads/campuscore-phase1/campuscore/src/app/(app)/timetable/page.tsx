import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function StudentTimetablePage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const supabase = createClient();

  // Scoped to enrolled courses only — timetable_slots RLS already enforces
  // this (is_enrolled_in()), this query just asks for exactly that.
  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("course_offering_id")
    .eq("student_id", ctx.userId)
    .in("status", ["active", "completed"]);

  const offeringIds = (enrollmentRows ?? []).map((e) => e.course_offering_id);

  const { data: slots } =
    offeringIds.length > 0
      ? await supabase
          .from("timetable_slots")
          .select("id, venue, session_type, day_of_week, exam_date, start_time, end_time, course_offerings(courses(code)), lecturers(full_name)")
          .in("course_offering_id", offeringIds)
      : { data: [] };

  const weekly = (slots ?? []).filter((s) => s.session_type !== "exam");
  const exams = (slots ?? []).filter((s) => s.session_type === "exam").sort((a, b) => (a.exam_date ?? "").localeCompare(b.exam_date ?? ""));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
      <p className="mt-1 text-sm text-slate-500">Derived from the course offerings you&apos;re enrolled in.</p>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Weekly lectures &amp; practicals</h2>
        <div className="mt-3 space-y-4">
          {DAYS.map((day, dayIndex) => {
            const daySlots = weekly
              .filter((s) => s.day_of_week === dayIndex)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            if (daySlots.length === 0) return null;
            return (
              <div key={day}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{day}</p>
                <div className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                  {daySlots.map((s) => {
                    const offering = s.course_offerings as unknown as { courses: { code: string } } | null;
                    const lecturer = s.lecturers as unknown as { full_name: string } | null;
                    return (
                      <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                        <div>
                          <p className="font-medium text-slate-900">
                            {offering?.courses?.code}{" "}
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium capitalize text-slate-500">
                              {s.session_type}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {s.venue ?? "Venue TBA"}
                            {lecturer && ` · ${lecturer.full_name}`}
                          </p>
                        </div>
                        <p className="text-slate-600">
                          {s.start_time}–{s.end_time}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {weekly.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
              No weekly timetable published yet for your courses.
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Examination timetable</h2>
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {exams.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No exam dates published yet.</p>
          )}
          {exams.map((s) => {
            const offering = s.course_offerings as unknown as { courses: { code: string } } | null;
            return (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{offering?.courses?.code}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{s.venue ?? "Venue TBA"}</p>
                </div>
                <p className="text-slate-600">
                  {s.exam_date} · {s.start_time}–{s.end_time}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
