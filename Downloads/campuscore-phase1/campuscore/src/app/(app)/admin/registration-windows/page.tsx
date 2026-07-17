import Link from "next/link";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { deleteRegistrationWindow } from "@/lib/data/registration-windows";
import { Button } from "@/components/ui/button";

export default async function AdminRegistrationWindowsPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: windows } = await supabase
    .from("registration_windows")
    .select("id, opens_at, closes_at, requires_approval, max_units_per_student, semesters(name, academic_sessions(name))")
    .order("opens_at", { ascending: false });

  const now = new Date();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Registration Periods</h1>
          <p className="mt-1 text-sm text-slate-500">Controls when students can self-register for courses.</p>
        </div>
        <Link href="/admin/registration-windows/new">
          <Button>New window</Button>
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Semester</th>
              <th className="px-4 py-2">Opens</th>
              <th className="px-4 py-2">Closes</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Approval</th>
              <th className="px-4 py-2">Unit cap</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(windows ?? []).map((w) => {
              const semester = w.semesters as unknown as { name: string; academic_sessions: { name: string } | null } | null;
              const opens = new Date(w.opens_at);
              const closes = new Date(w.closes_at);
              const isOpen = now >= opens && now <= closes;
              return (
                <tr key={w.id}>
                  <td className="px-4 py-2 font-medium text-slate-900">
                    {semester?.academic_sessions?.name} · {semester?.name}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{opens.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-600">{closes.toLocaleString()}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        isOpen
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500"
                      }
                    >
                      {isOpen ? "Open" : now < opens ? "Upcoming" : "Closed"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{w.requires_approval ? "Required" : "Automatic"}</td>
                  <td className="px-4 py-2 text-slate-600">{w.max_units_per_student ?? "No limit"}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-3">
                      <Link href={`/admin/registration-windows/${w.id}/edit`} className="text-sm text-brand hover:underline">
                        Edit
                      </Link>
                      <form action={deleteRegistrationWindow}>
                        <input type="hidden" name="window_id" value={w.id} />
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {(!windows || windows.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  No registration windows yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
