import { createClient } from "@/lib/supabase/server";

export async function getTimetableFormOptions() {
  const supabase = createClient();

  const [{ data: offerings }, { data: lecturers }] = await Promise.all([
    supabase
      .from("course_offerings")
      .select("id, level, courses(code, title), semesters(name, academic_sessions(name))")
      .order("level"),
    supabase.from("lecturers").select("id, full_name").order("full_name")
  ]);

  const offeringOptions = (offerings ?? []).map((o) => {
    const course = o.courses as unknown as { code: string; title: string } | null;
    const semester = o.semesters as unknown as { name: string; academic_sessions: { name: string } | null } | null;
    return {
      id: o.id,
      label: `${course?.code} — ${course?.title} (${o.level}L, ${semester?.academic_sessions?.name ?? "—"} ${semester?.name ?? ""})`
    };
  });

  return { offerings: offeringOptions, lecturers: lecturers ?? [] };
}
