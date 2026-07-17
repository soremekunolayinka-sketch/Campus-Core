import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { deleteCourse } from "@/lib/data/courses";
import { Button } from "@/components/ui/button";

export default async function AdminCoursesPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, code, title, units, default_status, departments(name)")
    .order("code");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Courses</h1>
          <p className="mt-1 text-sm text-slate-500">The course catalog — level/semester specifics live under Course Offerings.</p>
        </div>
        <Link href="/admin/courses/new">
          <Button>New course</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Code</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Units</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Department</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(courses ?? []).map((c) => {
              const dept = c.departments as unknown as { name: string } | null;
              return (
                <tr key={c.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">{c.code}</td>
                  <td className="px-4 py-2 text-slate-600">{c.title}</td>
                  <td className="px-4 py-2 text-slate-600">{c.units}</td>
                  <td className="px-4 py-2 text-slate-600">{c.default_status}</td>
                  <td className="px-4 py-2 text-slate-600">{dept?.name ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/courses/${c.id}/edit`} className="text-sm text-brand hover:underline">
                        Edit
                      </Link>
                      <form action={deleteCourse}>
                        <input type="hidden" name="course_id" value={c.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!courses || courses.length === 0) && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No courses yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
