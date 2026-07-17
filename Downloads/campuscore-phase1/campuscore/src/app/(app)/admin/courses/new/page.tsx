import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "@/lib/data/courses";
import { CourseForm } from "@/components/admin/course-form";

export default async function NewCoursePage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: departments } = await supabase.from("departments").select("id, name").order("name");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New course</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <CourseForm action={createCourse} departments={departments ?? []} />
      </div>
    </div>
  );
}
