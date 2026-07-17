import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { withdrawEnrollment } from "@/lib/data/enrollments";
import { Button } from "@/components/ui/button";

export default async function AdminEnrollmentsPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select(
      "id, enrollment_type, status, users(full_name, matric_number), course_offerings(level, courses(code, title))"
    )
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Enrollments</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enrollment is what grants a student access to a course — not their current level.
          </p>
        </div>
        <Link href="/admin/enrollments/new">
          <Button>New enrollment</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Student</th>
              <th className="px-4 py-2">Course</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(enrollments ?? []).map((e) => {
              const student = e.users as unknown as { full_name: string; matric_number: string | null } | null;
              const offering = e.course_offerings as unknown as {
                level: number;
                courses: { code: string; title: string };
              } | null;
              return (
                <tr key={e.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {student?.full_name}
                    <span className="ml-1 font-normal text-slate-400">{student?.matric_number ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {offering?.courses?.code} ({offering?.level}L)
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {e.enrollment_type !== "normal" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        {e.enrollment_type}
                      </span>
                    ) : (
                      "normal"
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{e.status}</td>
                  <td className="px-4 py-2 text-right">
                    {e.status === "active" && (
                      <form action={withdrawEnrollment}>
                        <input type="hidden" name="enrollment_id" value={e.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Withdraw
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
            {(!enrollments || enrollments.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No enrollments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
