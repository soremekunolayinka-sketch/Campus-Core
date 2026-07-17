import Link from "next/link";
import { redirect } from "next/navigation";
import { clsx } from "clsx";
import { getCurrentUserContext } from "@/lib/auth/session";
import { getAnnouncementsList, scopeLabel } from "@/lib/data/announcements";

export default async function AnnouncementsPage() {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const announcements = await getAnnouncementsList(ctx.userId);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Announcements</h1>
      <p className="mt-1 text-sm text-slate-500">
        Organization, department, and course announcements you have visibility into.
      </p>

      <div className="mt-6 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
        {announcements.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-400">No announcements yet.</p>
        )}
        {announcements.map((a) => (
          <Link
            key={a.id}
            href={`/announcements/${a.id}`}
            className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
          >
            {!a.isRead && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand" />}
            <div className={a.isRead ? "pl-5" : "flex-1"}>
              <div className="flex items-center gap-2">
                <p className={clsx("text-sm", a.isRead ? "font-normal text-slate-700" : "font-semibold text-slate-900")}>
                  {a.title}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  {scopeLabel(a.scope)}
                </span>
                {a.priority === "high" && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                    High priority
                  </span>
                )}
              </div>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-500">{a.body}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
