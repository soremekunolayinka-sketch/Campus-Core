import { createClient } from "@/lib/supabase/server";

export interface AnnouncementListItem {
  id: string;
  title: string;
  body: string;
  scope: string;
  priority: string;
  createdAt: string;
  isRead: boolean;
}

const SCOPE_LABELS: Record<string, string> = {
  university: "University",
  faculty: "Faculty",
  department: "Department",
  organization: "Organization",
  course_offering: "Course"
};

export function scopeLabel(scope: string): string {
  return SCOPE_LABELS[scope] ?? scope;
}

/**
 * RLS (0002 + the scope-visibility fix in 0005) already returns only the
 * announcements this user is allowed to see across every scope — this
 * function does no manual filtering, just attaches read state.
 */
export async function getAnnouncementsList(userId: string): Promise<AnnouncementListItem[]> {
  const supabase = createClient();

  const [{ data: announcementRows }, { data: readRows }] = await Promise.all([
    supabase
      .from("announcements")
      .select("id, title, body, scope, priority, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("announcement_reads").select("announcement_id").eq("user_id", userId)
  ]);

  const readIds = new Set((readRows ?? []).map((r) => r.announcement_id));

  return (announcementRows ?? []).map((a) => ({
    id: a.id,
    title: a.title,
    body: a.body,
    scope: a.scope,
    priority: a.priority,
    createdAt: a.created_at,
    isRead: readIds.has(a.id)
  }));
}
