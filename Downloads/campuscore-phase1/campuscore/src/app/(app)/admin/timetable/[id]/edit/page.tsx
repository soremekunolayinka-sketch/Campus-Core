import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { updateTimetableSlot } from "@/lib/data/timetable-admin";
import { getTimetableFormOptions } from "@/lib/data/timetable-form-options";
import { TimetableSlotForm } from "@/components/admin/timetable-slot-form";

export default async function EditTimetableSlotPage({ params }: { params: { id: string } }) {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const [{ data: slot }, { offerings, lecturers }] = await Promise.all([
    supabase
      .from("timetable_slots")
      .select("id, course_offering_id, lecturer_id, venue, session_type, day_of_week, exam_date, start_time, end_time")
      .eq("id", params.id)
      .single(),
    getTimetableFormOptions()
  ]);

  if (!slot) notFound();

  const boundUpdate = updateTimetableSlot.bind(null, slot.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Edit timetable entry</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <TimetableSlotForm action={boundUpdate} offerings={offerings} lecturers={lecturers} defaultValues={slot} />
      </div>
    </div>
  );
}
