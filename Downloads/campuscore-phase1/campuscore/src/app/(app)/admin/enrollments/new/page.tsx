import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createEnrollment } from "@/lib/data/enrollments";
import { EnrollmentForm } from "@/components/admin/enrollment-form";

export default async function NewEnrollmentPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const [{ data: students }, { data: offeringsRaw }] = await Promise.all([
    supabase.from("users").select("id, full_name, matric_number, current_level").order("full_name"),
    supabase
      .from("course_offerings")
      .select("id, level, status, courses(code, title), semesters(name, academic_sessions(name))")
      .order("level")
  ]);

  const offerings = (offeringsRaw ?? []).map((o) => {
    const course = o.courses as unknown as { code: string; title: string } | null;
    const semester = o.semesters as unknown as { name: string; academic_sessions: { name: string } | null } | null;
    return {
      id: o.id,
      label: `${course?.code} — ${course?.title} (${o.level}L, ${semester?.academic_sessions?.name ?? "—"} ${
        semester?.name ?? ""
      })`
    };
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New enrollment</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <EnrollmentForm action={createEnrollment} students={students ?? []} offerings={offerings} />
      </div>
    </div>
  );
}
