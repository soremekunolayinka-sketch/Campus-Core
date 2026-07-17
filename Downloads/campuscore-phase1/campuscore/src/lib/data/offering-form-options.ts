import { createClient } from "@/lib/supabase/server";

export async function getOfferingFormOptions() {
  const supabase = createClient();

  const [{ data: courses }, { data: semesters }] = await Promise.all([
    supabase.from("courses").select("id, code, title").order("code"),
    supabase.from("semesters").select("id, name, academic_sessions(name)").order("name")
  ]);

  return {
    courses: courses ?? [],
    semesters: (semesters ?? []).map((s) => {
      const session = s.academic_sessions as unknown as { name: string } | null;
      return { id: s.id, label: `${session?.name ?? "—"} — ${s.name}` };
    })
  };
}
