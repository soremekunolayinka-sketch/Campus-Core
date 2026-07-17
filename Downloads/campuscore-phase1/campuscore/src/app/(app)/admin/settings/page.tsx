import { requireRole } from "@/lib/auth/require-role";

export default async function AdminSettingsPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
      <p className="mt-3 text-sm text-slate-500">
        Organization settings (academic session management, semester dates, branding) aren&apos;t built yet —
        this page is a placeholder so the navigation structure is complete for Phase 2. Building this out
        wasn&apos;t part of the current priority list; flag it if you&apos;d like it scheduled.
      </p>
    </div>
  );
}
