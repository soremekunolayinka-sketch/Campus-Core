import { requireRole } from "@/lib/auth/require-role";
import { getAdminOverviewCounts } from "@/lib/data/admin-overview";

export default async function AdminDashboardPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const counts = await getAdminOverviewCounts();

  const cards = [
    { label: "Students", value: counts.students },
    { label: "Courses", value: counts.courses },
    { label: "Departments", value: counts.departments },
    { label: "Enrollments", value: counts.enrollments }
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Overview scoped to your organization.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-2xl font-semibold text-slate-900">{card.value}</p>
            <p className="mt-1 text-sm text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
