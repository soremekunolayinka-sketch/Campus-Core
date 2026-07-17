import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { updateRegistrationWindow } from "@/lib/data/registration-windows";
import { getSemesterOptions } from "@/lib/data/semester-options";
import { RegistrationWindowForm } from "@/components/admin/registration-window-form";

export default async function EditRegistrationWindowPage({ params }: { params: { id: string } }) {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const [{ data: windowRow }, semesters] = await Promise.all([
    supabase
      .from("registration_windows")
      .select("id, semester_id, opens_at, closes_at, requires_approval, max_units_per_student")
      .eq("id", params.id)
      .single(),
    getSemesterOptions()
  ]);

  if (!windowRow) notFound();

  const boundUpdate = updateRegistrationWindow.bind(null, windowRow.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Edit registration window</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <RegistrationWindowForm action={boundUpdate} semesters={semesters} defaultValues={windowRow} />
      </div>
    </div>
  );
}
