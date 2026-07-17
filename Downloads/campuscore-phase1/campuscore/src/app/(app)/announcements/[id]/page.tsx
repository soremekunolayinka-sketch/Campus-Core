import { notFound, redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { scopeLabel } from "@/lib/data/announcements";
import { MarkReadOnView } from "@/components/announcements/mark-read-on-view";

export default async function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const ctx = await getCurrentUserContext();
  if (!ctx) redirect("/login");

  const supabase = createClient();
  const { data: announcement } = await supabase
    .from("announcements")
    .select("id, title, body, scope, priority, created_at")
    .eq("id", params.id)
    .single();

  // RLS returning nothing here means either it doesn't exist or this user
  // isn't in its visibility scope — either way, 404 is the right response;
  // we don't distinguish, so as not to leak which announcements exist.
  if (!announcement) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <MarkReadOnView announcementId={announcement.id} />

      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
        {scopeLabel(announcement.scope)}
      </span>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">{announcement.title}</h1>
      <p className="mt-1 text-xs text-slate-400">
        {new Date(announcement.created_at).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric"
        })}
      </p>
      <p className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{announcement.body}</p>
    </div>
  );
}
