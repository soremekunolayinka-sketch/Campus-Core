import { requireRole } from "@/lib/auth/require-role";
import { createOffering } from "@/lib/data/course-offerings";
import { getOfferingFormOptions } from "@/lib/data/offering-form-options";
import { OfferingForm } from "@/components/admin/offering-form";

export default async function NewOfferingPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const { courses, semesters } = await getOfferingFormOptions();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New course offering</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <OfferingForm action={createOffering} courses={courses} semesters={semesters} />
      </div>
    </div>
  );
}
