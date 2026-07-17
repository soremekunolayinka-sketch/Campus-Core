import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { updateOffering } from "@/lib/data/course-offerings";
import { getOfferingFormOptions } from "@/lib/data/offering-form-options";
import { OfferingForm } from "@/components/admin/offering-form";

export default async function EditOfferingPage({ params }: { params: { id: string } }) {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const [{ data: offering }, { courses, semesters }] = await Promise.all([
    supabase
      .from("course_offerings")
      .select("id, course_id, semester_id, level, status")
      .eq("id", params.id)
      .single(),
    getOfferingFormOptions()
  ]);

  if (!offering) notFound();

  const boundUpdateOffering = updateOffering.bind(null, offering.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Edit course offering</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <OfferingForm
          action={boundUpdateOffering}
          courses={courses}
          semesters={semesters}
          defaultValues={offering}
        />
      </div>
    </div>
  );
}
