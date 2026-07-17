import { requireRole } from "@/lib/auth/require-role";
import { createCalendarEvent } from "@/lib/data/calendar-admin";
import { CalendarEventForm } from "@/components/admin/calendar-event-form";

export default async function NewCalendarEventPage() {
  await requireRole(["organization_admin", "university_admin", "platform_owner"]);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">New calendar event</h1>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <CalendarEventForm action={createCalendarEvent} />
      </div>
    </div>
  );
}
