import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { updateCalendarEvent } from "@/lib/data/calendar-admin";
import { CalendarEventForm } from "@/components/admin/calendar-event-form";

export default async function EditCalendarEventPage({ params }: { params: { id: string } }) {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);
  const supabase = createClient();

  const { data: event } = await supabase
    .from("calendar_events")
    .select("id, title, type, start_date, end_date, description")
    .eq("id", params.id)
    .single();

  if (!event) notFound();

  const boundUpdate = updateCalendarEvent.bind(null, event.id);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Edit calendar event</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <CalendarEventForm action={boundUpdate} defaultValues={event} />
      </div>
    </div>
  );
}
