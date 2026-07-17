import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { deleteOffering } from "@/lib/data/course-offerings";
import { Button } from "@/components/ui/button";

export default async function AdminCourseOfferingsPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: offerings } = await supabase
    .from("course_offerings")
    .select("id, level, status, courses(code, title), semesters(name, academic_sessions(name))")
    .order("level");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Course Offerings</h1>
          <p className="mt-1 text-sm text-slate-500">A course as taught in a specific semester, at a given level.</p>
        </div>
        <Link href="/admin/course-offerings/new">
          <Button>New offering</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Course</th>
              <th className="px-4 py-2">Level</th>
              <th className="px-4 py-2">Semester</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(offerings ?? []).map((o) => {
              const course = o.courses as unknown as { code: string; title: string } | null;
              const semester = o.semesters as unknown as {
                name: string;
                academic_sessions: { name: string } | null;
              } | null;
              return (
                <tr key={o.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {course?.code} <span className="font-normal text-slate-500">{course?.title}</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{o.level}L</td>
                  <td className="px-4 py-2 text-slate-600">
                    {semester?.academic_sessions?.name} · {semester?.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{o.status}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        href={`/admin/course-offerings/${o.id}/edit`}
                        className="text-sm text-brand hover:underline"
                      >
                        Edit
                      </Link>
                      <form action={deleteOffering}>
                        <input type="hidden" name="offering_id" value={o.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!offerings || offerings.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No course offerings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
