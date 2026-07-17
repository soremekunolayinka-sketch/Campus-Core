import { createClient } from "@/lib/supabase/server";

export async function getSemesterOptions() {
  const supabase = createClient();
  const { data: semesters } = await supabase
    .from("semesters")
    .select("id, name, academic_sessions(name)")
    .order("name");

  return (semesters ?? []).map((s) => {
    const session = s.academic_sessions as unknown as { name: string } | null;
    return { id: s.id, label: `${session?.name ?? "—"} — ${s.name}` };
  });
}
