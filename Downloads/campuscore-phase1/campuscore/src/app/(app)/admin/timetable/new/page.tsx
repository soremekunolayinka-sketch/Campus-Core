import { requireRole } from "@/lib/auth/require-role";
import { createTimetableSlot } from "@/lib/data/timetable-admin";
import { getTimetableFormOptions } from "@/lib/data/timetable-form-options";
import { TimetableSlotForm } from "@/components/admin/timetable-slot-form";

export default async function NewTimetableSlotPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const { offerings, lecturers } = await getTimetableFormOptions();

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New timetable entry</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <TimetableSlotForm action={createTimetableSlot} offerings={offerings} lecturers={lecturers} />
      </div>
    </div>
  );
}
