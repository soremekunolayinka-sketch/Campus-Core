import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { deleteTimetableSlot } from "@/lib/data/timetable-admin";
import { Button } from "@/components/ui/button";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function AdminTimetablePage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: slots } = await supabase
    .from("timetable_slots")
    .select("id, venue, session_type, day_of_week, exam_date, start_time, end_time, course_offerings(courses(code)), lecturers(full_name)")
    .order("session_type");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Timetable</h1>
          <p className="mt-1 text-sm text-slate-500">Lecture, practical, and examination schedules.</p>
        </div>
        <Link href="/admin/timetable/new">
          <Button>New entry</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Course</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">When</th>
              <th className="px-4 py-2">Time</th>
              <th className="px-4 py-2">Venue</th>
              <th className="px-4 py-2">Lecturer</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(slots ?? []).map((s) => {
              const offering = s.course_offerings as unknown as { courses: { code: string } } | null;
              const lecturer = s.lecturers as unknown as { full_name: string } | null;
              return (
                <tr key={s.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{offering?.courses?.code}</td>
                  <td className="px-4 py-2 text-slate-600 capitalize">{s.session_type}</td>
                  <td className="px-4 py-2 text-slate-600">
                    {s.session_type === "exam" ? s.exam_date : DAYS[s.day_of_week ?? 0]}
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {s.start_time}–{s.end_time}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{s.venue ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-600">{lecturer?.full_name ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/timetable/${s.id}/edit`} className="text-sm text-brand hover:underline">
                        Edit
                      </Link>
                      <form action={deleteTimetableSlot}>
                        <input type="hidden" name="slot_id" value={s.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!slots || slots.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No timetable entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
