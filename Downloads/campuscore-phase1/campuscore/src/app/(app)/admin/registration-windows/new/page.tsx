import { requireRole } from "@/lib/auth/require-role";
import { createRegistrationWindow } from "@/lib/data/registration-windows";
import { getSemesterOptions } from "@/lib/data/semester-options";
import { RegistrationWindowForm } from "@/components/admin/registration-window-form";

export default async function NewRegistrationWindowPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const semesters = await getSemesterOptions();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New registration window</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <RegistrationWindowForm action={createRegistrationWindow} semesters={semesters} />
      </div>
    </div>
  );
}
