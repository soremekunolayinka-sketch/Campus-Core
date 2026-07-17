import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/data/student-dashboard";
import { highestRoleLabel } from "@/lib/auth/permissions";

const DEADLINE_LABELS: Record<string, string> = {
  registration: "Registration period",
  test: "Test",
  exam: "Examination",
  holiday: "Holiday",
  milestone: "Milestone",
  add_drop_deadline: "Add/Drop deadline"
};

export default async function DashboardPage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const { enrollments, totalUnits, registrationStatusLabel, announcements, unreadAnnouncementCount, upcomingDeadlines } =
    await getDashboardData(ctx.userId);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back, {ctx.fullName.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {highestRoleLabel(ctx)} · {ctx.currentLevel ? `${ctx.currentLevel} Level` : "Level not set"}
        </p>
      </header>

      {/* Academic summary */}
      <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Registered courses" value={enrollments.length} />
        <SummaryCard label="Total units" value={totalUnits} />
        <SummaryCard label="Registration status" value={registrationStatusLabel} />
        <SummaryCard label="Unread announcements" value={unreadAnnouncementCount} />
      </section>

      {/* Quick actions */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <QuickAction href="/register-courses" label="Register Courses" />
          <QuickAction href="/courses" label="My Courses" />
          <QuickAction href="/timetable" label="Timetable" />
          <QuickAction href="/calendar" label="Calendar" />
          <QuickAction href="/announcements" label="Announcements" />
          <QuickAction href="/profile" label="Profile" />
        </div>
      </section>

      {/* Upcoming deadlines */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Upcoming deadlines</h2>
          <Link href="/calendar" className="text-xs text-brand hover:underline">
            View calendar
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {upcomingDeadlines.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">Nothing scheduled yet.</p>
          )}
          {upcomingDeadlines.map((d) => (
            <div key={d.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium text-slate-900">{d.title}</span>
              <span className="text-slate-500">
                {DEADLINE_LABELS[d.type] ?? d.type} · {d.startDate}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent announcements */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Recent announcements</h2>
          <Link href="/announcements" className="text-xs text-brand hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {announcements.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No announcements yet.</p>
          )}
          {announcements.map((a) => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3">
              {!a.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />}
              <div className={a.isRead ? "pl-5" : ""}>
                <p className="text-sm font-medium text-slate-900">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{a.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Registered courses */}
      <section className="mt-8">
        <h2 className="text-sm font-medium text-slate-700">Your registered courses</h2>
        {enrollments.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No courses registered yet.{" "}
            <Link href="/register-courses" className="text-brand hover:underline">
              Register now
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {enrollments.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>
                  <span className="font-medium text-slate-900">{e.courseCode}</span>{" "}
                  <span className="text-slate-500">{e.courseTitle}</span>
                </span>
                <span className="flex gap-2">
                  {e.status === "pending_approval" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Pending
                    </span>
                  )}
                  {e.enrollmentType !== "normal" && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {e.enrollmentType}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {label}
    </Link>
  );
}
