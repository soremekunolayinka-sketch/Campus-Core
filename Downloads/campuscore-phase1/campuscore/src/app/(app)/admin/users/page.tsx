import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

/**
 * Read-only for now — role assignment (granting course_rep/class_governor/
 * organization_admin) wasn't in the Phase 2 spec, so it's intentionally
 * left as a follow-up rather than built speculatively here.
 */
export default async function AdminUsersPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, matric_number, current_level")
    .order("full_name");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Users</h1>
      <p className="mt-1 text-sm text-slate-500">{users?.length ?? 0} users in your organization.</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Matric No.</th>
              <th className="px-4 py-2">Level</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(users ?? []).map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-medium text-slate-900">{u.full_name}</td>
                <td className="px-4 py-2 text-slate-600">{u.email}</td>
                <td className="px-4 py-2 text-slate-600">{u.matric_number ?? "—"}</td>
                <td className="px-4 py-2 text-slate-600">{u.current_level ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
