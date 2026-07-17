import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { updateCourse } from "@/lib/data/courses";
import { CourseForm } from "@/components/admin/course-form";

export default async function EditCoursePage({ params }: { params: { id: string } }) {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const [{ data: course }, { data: departments }] = await Promise.all([
    supabase
      .from("courses")
      .select("id, department_id, code, title, units, default_status, lecture_hours, practical_hours")
      .eq("id", params.id)
      .single(),
    supabase.from("departments").select("id, name").order("name")
  ]);

  if (!course) notFound();

  const boundUpdateCourse = updateCourse.bind(null, course.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Edit course</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <CourseForm action={boundUpdateCourse} departments={departments ?? []} defaultValues={course} />
      </div>
    </div>
  );
}
