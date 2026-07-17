import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { deleteCalendarEvent } from "@/lib/data/calendar-admin";
import { Button } from "@/components/ui/button";

const EVENT_TYPE_LABELS: Record<string, string> = {
  registration: "Registration period",
  test: "Test",
  exam: "Examination",
  holiday: "Holiday",
  milestone: "Milestone",
  add_drop_deadline: "Add/Drop deadline"
};

export default async function AdminCalendarPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, type, start_date, end_date")
    .order("start_date");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Academic Calendar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Registration periods, deadlines, tests, exams, holidays, and semester milestones.
          </p>
        </div>
        <Link href="/admin/calendar/new">
          <Button>New event</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Dates</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(events ?? []).map((e) => (
              <tr key={e.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{e.title}</td>
                <td className="px-4 py-2 text-slate-600">{EVENT_TYPE_LABELS[e.type] ?? e.type}</td>
                <td className="px-4 py-2 text-slate-600">
                  {e.start_date}
                  {e.end_date && ` – ${e.end_date}`}
                </td>
                <td className="px-4 py-2 text-right">
                  <div className="flex justify-end gap-3">
                    <Link href={`/admin/calendar/${e.id}/edit`} className="text-sm text-brand hover:underline">
                      Edit
                    </Link>
                    <form action={deleteCalendarEvent}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <button type="submit" className="text-sm text-red-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {(!events || events.length === 0) && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  No calendar events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
