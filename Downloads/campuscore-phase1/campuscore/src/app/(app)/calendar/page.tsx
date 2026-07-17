import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const EVENT_TYPE_LABELS: Record<string, string> = {
  registration: "Registration period",
  test: "Test",
  exam: "Examination",
  holiday: "Holiday",
  milestone: "Milestone",
  add_drop_deadline: "Add/Drop deadline"
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  registration: "bg-blue-100 text-blue-800",
  test: "bg-purple-100 text-purple-800",
  exam: "bg-red-100 text-red-800",
  holiday: "bg-green-100 text-green-800",
  milestone: "bg-slate-100 text-slate-600",
  add_drop_deadline: "bg-amber-100 text-amber-800"
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AcademicCalendarPage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const supabase = createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, type, start_date, end_date, description")
    .order("start_date");

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (events ?? []).filter((e) => (e.end_date ?? e.start_date) >= today);
  const past = (events ?? []).filter((e) => (e.end_date ?? e.start_date) < today);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Academic Calendar</h1>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Upcoming</h2>
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {upcoming.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing scheduled yet.</p>
          )}
          {upcoming.map((e) => {
            const remaining = daysUntil(e.start_date);
            return (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{e.title}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${EVENT_TYPE_COLORS[e.type] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {EVENT_TYPE_LABELS[e.type] ?? e.type}
                    </span>
                  </div>
                  {e.description && <p className="mt-0.5 text-xs text-slate-400">{e.description}</p>}
                </div>
                <div className="text-right">
                  <p className="text-slate-600">
                    {e.start_date}
                    {e.end_date && ` – ${e.end_date}`}
                  </p>
                  <p className="text-xs text-slate-400">
                    {remaining === 0 ? "Today" : remaining > 0 ? `in ${remaining} day${remaining === 1 ? "" : "s"}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {past.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-slate-700">Past</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white opacity-60">
            {past.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{e.title}</p>
                <p className="text-slate-600">{e.start_date}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
